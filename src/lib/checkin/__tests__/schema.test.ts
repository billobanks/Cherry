import { describe, expect, it } from "vitest";
import { checkinFormSchema } from "../schema";
import { emptyCheckinFormValues } from "../types";

describe("checkinFormSchema", () => {
  it("accepts a fully blank check-in for today", () => {
    const result = checkinFormSchema.safeParse(emptyCheckinFormValues("2026-01-01"));
    expect(result.success).toBe(true);
  });

  it("accepts a fully filled-out check-in", () => {
    const result = checkinFormSchema.safeParse({
      checkinDate: "2026-01-01",
      flow: "medium",
      mood: ["happy", "stressed"],
      energyLevel: 3,
      sleepQuality: 4,
      symptomKeys: ["cramps", "bloating"],
      discharge: "creamy",
      exercise: "light",
      libido: 2,
      notes: "Felt pretty good today.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a future-dated check-in", () => {
    const result = checkinFormSchema.safeParse(emptyCheckinFormValues("2099-01-01"));
    expect(result.success).toBe(false);
  });

  it("rejects an out-of-range energy level", () => {
    const result = checkinFormSchema.safeParse({
      ...emptyCheckinFormValues("2026-01-01"),
      energyLevel: 6,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown mood value", () => {
    const result = checkinFormSchema.safeParse({
      ...emptyCheckinFormValues("2026-01-01"),
      mood: ["furious"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects notes over the max length", () => {
    const result = checkinFormSchema.safeParse({
      ...emptyCheckinFormValues("2026-01-01"),
      notes: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts notes at exactly the max length", () => {
    const result = checkinFormSchema.safeParse({
      ...emptyCheckinFormValues("2026-01-01"),
      notes: "a".repeat(2000),
    });
    expect(result.success).toBe(true);
  });
});
