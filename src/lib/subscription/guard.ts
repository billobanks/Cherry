import type { createClient } from "@/lib/supabase/server";
import { hasPremiumAccess } from "./access";
import { FREE_SUBSCRIPTION_STATE } from "./types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Server-side entitlement check meant to be called INSIDE another feature's
 * server action — not just at the page level. A page-level check alone only
 * stops a user clicking around the UI; a server action is its own callable
 * endpoint, so `getMovementRecommendation`, `getNutritionData`, and friends
 * each call this themselves before doing any premium work. That's what
 * "never rely only on the frontend" actually requires.
 */
export async function hasPremiumAccessForUser(supabase: Supabase, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end, cancel_at_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  const state = data
    ? {
        plan: data.plan,
        status: data.status,
        currentPeriodEnd: data.current_period_end,
        cancelAtPeriodEnd: data.cancel_at_period_end,
      }
    : FREE_SUBSCRIPTION_STATE;

  return hasPremiumAccess(state);
}
