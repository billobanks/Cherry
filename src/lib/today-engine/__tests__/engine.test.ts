import { describe, expect, it } from "vitest";
import { buildTodayEngineOutput } from "../engine";
import type { TodayEngineInput } from "../types";

function baseInput(overrides: Partial<TodayEngineInput> = {}): TodayEngineInput {
  return {
    cycleDay: 24,
    phase: "luteal",
    today: null,
    historicalPatterns: [],
    goals: [],
    dietaryPreference: "none",
    foodAllergies: [],
    foodsToAvoid: [],
    preferredMovementTypes: [],
    dayNumber: 100,
    ...overrides,
  };
}

describe("buildTodayEngineOutput", () => {
  it("echoes cycle day and phase", () => {
    const output = buildTodayEngineOutput(baseInput());
    expect(output.cycleDay).toBe(24);
    expect(output.phase).toBe("luteal");
  });

  it("falls back to phase-only headline and body insight when nothing is logged today", () => {
    const output = buildTodayEngineOutput(baseInput({ today: null }));
    expect(output.headline.length).toBeGreaterThan(0);
    expect(output.bodyInsight.length).toBeGreaterThan(0);
  });

  it("surfaces a slower-pace headline when energy is low today", () => {
    const output = buildTodayEngineOutput(
      baseInput({ today: { energyLevel: 1, sleepQuality: null, mood: [], symptomKeys: [] } }),
    );
    expect(output.headline).toBe("Your body may be asking for a slower pace today.");
  });

  it("surfaces a slower-pace headline when cramps are logged, even with normal energy", () => {
    const output = buildTodayEngineOutput(
      baseInput({ today: { energyLevel: 3, sleepQuality: 3, mood: [], symptomKeys: ["cramps"] } }),
    );
    expect(output.headline).toBe("Your body may be asking for a slower pace today.");
  });

  it("surfaces a higher-energy headline when energy is high and nothing else overrides it", () => {
    const output = buildTodayEngineOutput(
      baseInput({ today: { energyLevel: 5, sleepQuality: 4, mood: [], symptomKeys: [] } }),
    );
    expect(output.headline).toBe("You might have a bit more energy to work with today.");
  });

  it("low energy always wins over a high energy rating when both are somehow present in symptoms", () => {
    // cramps (a physical signal) should still win even if energy is rated high
    const output = buildTodayEngineOutput(
      baseInput({ today: { energyLevel: 5, sleepQuality: null, mood: [], symptomKeys: ["cramps"] } }),
    );
    expect(output.headline).toBe("Your body may be asking for a slower pace today.");
  });

  it("picks a nutrition suggestion that respects dietary preference", () => {
    const output = buildTodayEngineOutput(baseInput({ dietaryPreference: "vegan" }));
    expect(["vegan"]).toContain(output.nutrition.meal.dietClass);
  });

  it("delegates movement to the deterministic movement engine and reflects logged cramps", () => {
    const output = buildTodayEngineOutput(
      baseInput({ today: { energyLevel: 3, sleepQuality: 3, mood: [], symptomKeys: ["cramps"] } }),
    );
    expect(output.movement.tier).toBe("gentle");
    expect(output.movement.overrideReason).toBe("cramps");
  });

  it("produces symptom awareness notes for symptoms actually logged today, phrased non-diagnostically", () => {
    const output = buildTodayEngineOutput(
      baseInput({ phase: "menstrual", today: { energyLevel: null, sleepQuality: null, mood: [], symptomKeys: ["cramps"] } }),
    );
    expect(output.symptomAwareness.some((n) => n.key === "cramps")).toBe(true);
    expect(output.symptomAwareness.map((n) => n.note).join(" ")).not.toMatch(/you have|diagnos/i);
  });

  it("includes historical pattern sentences with the supporting cycle count, never phrased as a diagnosis", () => {
    const output = buildTodayEngineOutput(
      baseInput({
        historicalPatterns: [{ symptomKey: "headache", label: "headaches", occurrences: 3, eligibleCycles: 4 }],
      }),
    );
    const note = output.symptomAwareness.find((n) => n.key === "headache");
    expect(note?.note).toBe("You've noticed headaches coming up during this phase in 3 of your last 4 cycles.");
  });

  it("caps symptom awareness notes at 4", () => {
    const output = buildTodayEngineOutput(
      baseInput({
        phase: "menstrual",
        today: { energyLevel: null, sleepQuality: null, mood: [], symptomKeys: ["cramps", "bloating", "fatigue", "headache", "backache"] },
      }),
    );
    expect(output.symptomAwareness.length).toBeLessThanOrEqual(4);
  });

  it("recommends the symptoms-to-monitor article when a related symptom was logged today", () => {
    const output = buildTodayEngineOutput(
      baseInput({ phase: "menstrual", today: { energyLevel: null, sleepQuality: null, mood: [], symptomKeys: ["cramps"] } }),
    );
    expect(output.recommendedArticle.sectionKey).toBe("symptoms_to_monitor");
  });

  it("falls back to a goal-mapped article when nothing logged today points anywhere more specific", () => {
    const output = buildTodayEngineOutput(baseInput({ today: null, goals: ["improve_sleep"] }));
    expect(output.recommendedArticle.sectionKey).toBe("sleep");
  });

  it("defaults the recommended article to self_care with no today signals and no matching goals", () => {
    const output = buildTodayEngineOutput(baseInput({ today: null, goals: [] }));
    expect(output.recommendedArticle.sectionKey).toBe("self_care");
  });

  it("is deterministic for a fixed dayNumber", () => {
    const a = buildTodayEngineOutput(baseInput({ dayNumber: 42 }));
    const b = buildTodayEngineOutput(baseInput({ dayNumber: 42 }));
    expect(a).toEqual(b);
  });

  it("never states a symptom cause as fact or uses absolutist language", () => {
    const output = buildTodayEngineOutput(
      baseInput({ today: { energyLevel: 2, sleepQuality: 2, mood: ["stressed"], symptomKeys: ["cramps", "headache"] } }),
    );
    const allText = JSON.stringify(output);
    expect(allText).not.toMatch(/\bwill\b/i);
    expect(allText).not.toMatch(/\balways\b/i);
    expect(allText).not.toMatch(/diagnos/i);
  });
});
