import { describe, expect, it } from "vitest";
import { mapStripeStatus } from "../stripe-status-map";

describe("mapStripeStatus", () => {
  it.each([
    ["trialing", "trialing"],
    ["active", "active"],
    ["past_due", "past_due"],
    ["canceled", "canceled"],
  ] as const)("maps Stripe's %s to %s", (stripeStatus, expected) => {
    expect(mapStripeStatus(stripeStatus)).toBe(expected);
  });

  it.each(["incomplete", "incomplete_expired", "unpaid", "paused"])(
    "collapses %s to expired (no access)",
    (stripeStatus) => {
      expect(mapStripeStatus(stripeStatus)).toBe("expired");
    },
  );

  it("falls back to expired for any unrecognized status", () => {
    expect(mapStripeStatus("some_future_stripe_status")).toBe("expired");
  });
});
