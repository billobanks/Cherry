import type { SubscriptionStatus } from "./types";

/**
 * Stripe's own subscription.status has more values than the app needs
 * (incomplete, incomplete_expired, unpaid, paused, in addition to the ones
 * we track). Everything that isn't a state we actively grant or explicitly
 * track collapses to `expired` — a subscription that never became active or
 * that Stripe has given up on shouldn't unlock anything, and `expired`
 * already means "no access" in `hasPremiumAccess`.
 */
export function mapStripeStatus(stripeStatus: string): SubscriptionStatus {
  switch (stripeStatus) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "incomplete":
    case "incomplete_expired":
    case "unpaid":
    case "paused":
    default:
      return "expired";
  }
}
