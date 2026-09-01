import { createServiceRoleClient } from "@/lib/supabase/service";
import type { SubscriptionEventType } from "@/types/database";

type SupabaseServiceClient = ReturnType<typeof createServiceRoleClient>;

/** Human-readable audit trail of subscription lifecycle events, written by the Stripe webhook alongside the state-only `subscriptions` upsert. */
export async function recordSubscriptionEvent(
  supabase: SupabaseServiceClient,
  input: {
    userId: string;
    subscriptionId: string | null;
    eventType: SubscriptionEventType;
    stripeEventId: string | null;
    payload?: Record<string, unknown>;
  },
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("subscription_events").insert({
    user_id: input.userId,
    subscription_id: input.subscriptionId,
    event_type: input.eventType,
    stripe_event_id: input.stripeEventId,
    payload: input.payload ?? {},
  });

  return { error: error?.message ?? null };
}
