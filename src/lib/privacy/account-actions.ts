"use server";

import { checkRateLimit } from "@/lib/rate-limit";
import { getStripeClient } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

export type DeleteAccountResult =
  | { status: "deleted" }
  | { status: "signed_out" }
  | { status: "rate_limited"; retryAfterSeconds: number | null }
  | { status: "error"; message: string };

/**
 * Permanently deletes the account: cancels any active Stripe subscription
 * first (so nobody keeps getting billed after deleting their data), records
 * a minimal, non-identifying audit entry, then deletes the auth.users row —
 * every other table cascades from there via ON DELETE CASCADE. There's no
 * soft delete or grace period: this is immediate and irreversible, which is
 * why it's rate limited and the UI requires explicit typed confirmation
 * before ever calling this.
 */
export async function deleteAccount(): Promise<DeleteAccountResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const rateLimit = await checkRateLimit("accountDeletion", user.id);
  if (!rateLimit.allowed) {
    return { status: "rate_limited", retryAfterSeconds: rateLimit.retryAfterSeconds };
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const stripe = getStripeClient();
  if (stripe && subscription?.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
    } catch {
      // Don't block account deletion on Stripe being unreachable or the
      // subscription already being gone — the user's data still gets
      // deleted; worst case is a billing follow-up, not data left behind.
    }
  }

  const serviceClient = createServiceRoleClient();

  await serviceClient.from("account_deletion_log").insert({ deleted_user_id: user.id });

  const { error } = await serviceClient.auth.admin.deleteUser(user.id);
  if (error) {
    return { status: "error", message: "Couldn't delete your account — please try again or contact support." };
  }

  return { status: "deleted" };
}
