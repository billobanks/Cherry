import type { SubscriptionState, SubscriptionStatus } from "./types";

/**
 * Statuses that keep premium features unlocked. `past_due` is included
 * deliberately — Stripe is still retrying the payment automatically, and
 * cutting access the instant a card fails is a harsh default for a wellness
 * app. Once Stripe gives up it moves the subscription to `canceled` (or the
 * webhook maps it to `expired`), which does lose access below.
 */
const STATUSES_WITH_ACCESS: ReadonlySet<SubscriptionStatus> = new Set(["trialing", "active", "past_due"]);

/**
 * The single source of truth for "does this user get Premium right now."
 * Pure and deterministic (injectable clock, like the rest of the app's
 * date-handling) so every guard — page-level or inside a server action —
 * calls this instead of re-deriving the rule. Never trust a plan/status
 * value that didn't come from a fresh server-side read of `subscriptions`.
 */
export function hasPremiumAccess(state: SubscriptionState, nowEpochMs: number = Date.now()): boolean {
  if (state.plan !== "premium") return false;
  if (!state.status || !STATUSES_WITH_ACCESS.has(state.status)) return false;

  // Defensive: even if the cached status looks entitled, a period end in the
  // past means access should already have lapsed — covers a missed or
  // delayed webhook rather than trusting status alone.
  if (state.currentPeriodEnd) {
    const periodEndMs = new Date(state.currentPeriodEnd).getTime();
    if (Number.isFinite(periodEndMs) && periodEndMs < nowEpochMs) return false;
  }

  return true;
}
