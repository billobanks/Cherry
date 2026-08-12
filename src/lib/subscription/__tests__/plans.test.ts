import { describe, expect, it } from "vitest";
import { FREE_PLAN, PREMIUM_PLAN } from "../plans";

describe("plan definitions", () => {
  it("Free plan includes exactly the specified features", () => {
    expect(FREE_PLAN.features).toEqual([
      "Period tracking",
      "Basic calendar",
      "Basic cycle prediction",
      "Symptom logging",
      "Limited daily insights",
    ]);
  });

  it("Premium plan includes exactly the specified features", () => {
    expect(PREMIUM_PLAN.features).toEqual([
      "Detailed daily body insights",
      "Personalized pattern recognition",
      "Advanced cycle reports",
      "Nutrition guidance",
      "Exercise guidance",
      "AI wellness assistant",
      "Historical trend analysis",
      "Unlimited educational content",
    ]);
  });

  it("no feature is listed on both plans", () => {
    const overlap = FREE_PLAN.features.filter((f) => PREMIUM_PLAN.features.includes(f));
    expect(overlap).toEqual([]);
  });
});
