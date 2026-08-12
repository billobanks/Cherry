import { describe, expect, it } from "vitest";
import { hasPremiumAccess } from "../access";
import type { SubscriptionState } from "../types";

const NOW = new Date("2026-08-15T00:00:00Z").getTime();

function state(overrides: Partial<SubscriptionState> = {}): SubscriptionState {
  return {
    plan: "premium",
    status: "active",
    currentPeriodEnd: "2026-09-01T00:00:00Z",
    cancelAtPeriodEnd: false,
    ...overrides,
  };
}

describe("hasPremiumAccess", () => {
  it("grants access for an active premium subscription", () => {
    expect(hasPremiumAccess(state({ status: "active" }), NOW)).toBe(true);
  });

  it("grants access during a trial", () => {
    expect(hasPremiumAccess(state({ status: "trialing" }), NOW)).toBe(true);
  });

  it("grants a grace period during past_due", () => {
    expect(hasPremiumAccess(state({ status: "past_due" }), NOW)).toBe(true);
  });

  it("denies access once canceled", () => {
    expect(hasPremiumAccess(state({ status: "canceled" }), NOW)).toBe(false);
  });

  it("denies access once expired", () => {
    expect(hasPremiumAccess(state({ status: "expired" }), NOW)).toBe(false);
  });

  it("denies access when there's no status at all (never subscribed)", () => {
    expect(hasPremiumAccess(state({ status: null }), NOW)).toBe(false);
  });

  it("denies access on the free plan regardless of status", () => {
    expect(hasPremiumAccess(state({ plan: "free", status: "active" }), NOW)).toBe(false);
  });

  it("denies access once the current period has actually ended, even if status still says active", () => {
    // Guards against a missed or delayed webhook rather than trusting a stale status.
    expect(
      hasPremiumAccess(state({ status: "active", currentPeriodEnd: "2026-08-01T00:00:00Z" }), NOW),
    ).toBe(false);
  });

  it("grants access when there's no period-end recorded yet (e.g. mid-trial)", () => {
    expect(hasPremiumAccess(state({ status: "trialing", currentPeriodEnd: null }), NOW)).toBe(true);
  });
});
