import { describe, expect, it } from "vitest";
import { deriveSubscriptionUpsert, type StripeSubscriptionLike } from "../webhook-events";

function subscriptionFixture(overrides: Partial<StripeSubscriptionLike> = {}): StripeSubscriptionLike {
  return {
    id: "sub_123",
    customer: "cus_123",
    status: "active",
    current_period_end: 1_800_000_000,
    cancel_at_period_end: false,
    ...overrides,
  };
}

describe("deriveSubscriptionUpsert", () => {
  it("always sets plan to premium — this table only tracks paid subscriptions", () => {
    const result = deriveSubscriptionUpsert(subscriptionFixture());
    expect(result.plan).toBe("premium");
  });

  it("carries the Stripe customer and subscription ids through", () => {
    const result = deriveSubscriptionUpsert(subscriptionFixture({ id: "sub_abc", customer: "cus_xyz" }));
    expect(result.stripeSubscriptionId).toBe("sub_abc");
    expect(result.stripeCustomerId).toBe("cus_xyz");
  });

  it("maps the Stripe status through the shared status mapper", () => {
    const result = deriveSubscriptionUpsert(subscriptionFixture({ status: "past_due" }));
    expect(result.status).toBe("past_due");
  });

  it("collapses an unrecognized/terminal Stripe status to expired", () => {
    const result = deriveSubscriptionUpsert(subscriptionFixture({ status: "unpaid" }));
    expect(result.status).toBe("expired");
  });

  it("converts the Unix period-end timestamp to an ISO string", () => {
    const result = deriveSubscriptionUpsert(subscriptionFixture({ current_period_end: 1_800_000_000 }));
    expect(result.currentPeriodEnd).toBe(new Date(1_800_000_000 * 1000).toISOString());
  });

  it("passes through a null period-end unchanged", () => {
    const result = deriveSubscriptionUpsert(subscriptionFixture({ current_period_end: null }));
    expect(result.currentPeriodEnd).toBeNull();
  });

  it("carries cancel_at_period_end through", () => {
    const result = deriveSubscriptionUpsert(subscriptionFixture({ cancel_at_period_end: true }));
    expect(result.cancelAtPeriodEnd).toBe(true);
  });
});
