import { mapStripeStatus } from "./stripe-status-map";
import type { SubscriptionPlan, SubscriptionStatus } from "./types";

/** The subset of Stripe.Subscription fields the mapping actually needs — kept minimal and easy to construct in tests. */
export interface StripeSubscriptionLike {
  id: string;
  customer: string;
  status: string;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
}

export interface SubscriptionUpsertPayload {
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

/**
 * Pure translation from "whatever Stripe just told us about a subscription"
 * to "what we write to our `subscriptions` row." Kept separate from the
 * webhook route handler (which does the actual signature verification and
 * database I/O) so this logic is unit-testable without mocking Stripe's SDK
 * or a request object.
 */
export function deriveSubscriptionUpsert(subscription: StripeSubscriptionLike): SubscriptionUpsertPayload {
  return {
    stripeCustomerId: subscription.customer,
    stripeSubscriptionId: subscription.id,
    plan: "premium",
    status: mapStripeStatus(subscription.status),
    currentPeriodEnd: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };
}
