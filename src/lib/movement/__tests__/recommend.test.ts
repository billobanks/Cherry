import { describe, expect, it } from "vitest";
import type { CyclePhase } from "@/lib/cycle-engine";
import { DURATION_BY_TIER, OPTIONS_BY_TIER } from "../catalog";
import { determineTier, generateMovementRecommendation, getGentlerOption } from "../recommend";
import type { TodaysSignals } from "../types";

function signals(overrides: Partial<TodaysSignals> & { phase: CyclePhase }): TodaysSignals {
  return {
    energyLevel: null,
    hasCramps: false,
    hasFatigue: false,
    sleepQuality: null,
    preferredTypes: [],
    dayNumber: 0,
    ...overrides,
  };
}

describe("determineTier — phase defaults with nothing logged", () => {
  it.each([
    ["menstrual", "gentle"],
    ["follicular", "moderate"],
    ["ovulation_window", "vigorous"],
    ["luteal", "moderate"],
  ] as const)("%s -> %s, no override", (phase, expectedTier) => {
    const result = determineTier(signals({ phase }));
    expect(result.tier).toBe(expectedTier);
    expect(result.reason).toBe("phase_only");
    expect(result.overrideApplied).toBe(false);
  });
});

describe("determineTier — individual override signals", () => {
  it("low energy pulls a moderate phase down to gentle", () => {
    const result = determineTier(signals({ phase: "follicular", energyLevel: 1 }));
    expect(result).toMatchObject({ tier: "gentle", reason: "low_energy", overrideApplied: true });
  });

  it("high energy bumps a gentle phase up to moderate", () => {
    const result = determineTier(signals({ phase: "menstrual", energyLevel: 5 }));
    expect(result).toMatchObject({ tier: "moderate", reason: "high_energy", overrideApplied: true });
  });

  it("high energy at an already-vigorous phase has nothing to bump to, so it's not reported as an override", () => {
    const result = determineTier(signals({ phase: "ovulation_window", energyLevel: 5 }));
    expect(result).toMatchObject({ tier: "vigorous", reason: "phase_only", overrideApplied: false });
  });

  it("cramps pull even a vigorous phase down to gentle", () => {
    const result = determineTier(signals({ phase: "ovulation_window", hasCramps: true }));
    expect(result).toMatchObject({ tier: "gentle", reason: "cramps", overrideApplied: true });
  });

  it("fatigue pulls a moderate phase down to gentle", () => {
    const result = determineTier(signals({ phase: "follicular", hasFatigue: true }));
    expect(result).toMatchObject({ tier: "gentle", reason: "fatigue", overrideApplied: true });
  });

  it("poor sleep quality pulls a moderate phase down to gentle", () => {
    const result = determineTier(signals({ phase: "luteal", sleepQuality: 1 }));
    expect(result).toMatchObject({ tier: "gentle", reason: "poor_sleep", overrideApplied: true });
  });

  it("mid-range energy (3) doesn't trigger any adjustment", () => {
    const result = determineTier(signals({ phase: "follicular", energyLevel: 3 }));
    expect(result).toMatchObject({ tier: "moderate", reason: "phase_only", overrideApplied: false });
  });
});

describe("determineTier — logged signals override the phase default when they conflict", () => {
  it("cramps win over high reported energy — the core 'actual data overrides assumptions' rule", () => {
    const result = determineTier(
      signals({ phase: "ovulation_window", energyLevel: 5, hasCramps: true }),
    );
    expect(result.tier).toBe("gentle");
    expect(result.reason).toBe("cramps");
  });

  it("fatigue wins over high reported energy", () => {
    const result = determineTier(signals({ phase: "menstrual", energyLevel: 5, hasFatigue: true }));
    expect(result.tier).toBe("gentle");
    expect(result.reason).toBe("fatigue");
  });

  it("poor sleep wins over high reported energy", () => {
    const result = determineTier(
      signals({ phase: "ovulation_window", energyLevel: 5, sleepQuality: 1 }),
    );
    expect(result.tier).toBe("gentle");
    expect(result.reason).toBe("poor_sleep");
  });

  it("with every symptom signal present at once, still lands on gentle", () => {
    const result = determineTier(
      signals({
        phase: "ovulation_window",
        energyLevel: 5,
        hasCramps: true,
        hasFatigue: true,
        sleepQuality: 1,
      }),
    );
    expect(result.tier).toBe("gentle");
  });
});

describe("generateMovementRecommendation — picking within the tier", () => {
  it("is fully deterministic for a fixed day number", () => {
    const input = signals({ phase: "follicular", dayNumber: 42 });
    const a = generateMovementRecommendation(input);
    const b = generateMovementRecommendation(input);
    expect(a.primary.key).toBe(b.primary.key);
    expect(a.alternative.key).toBe(b.alternative.key);
  });

  it("the alternative is always different from the primary", () => {
    for (let day = 0; day < 10; day++) {
      const rec = generateMovementRecommendation(signals({ phase: "menstrual", dayNumber: day }));
      expect(rec.alternative.key).not.toBe(rec.primary.key);
    }
  });

  it("rotates the pick across days rather than always returning the same option", () => {
    const picks = new Set(
      Array.from({ length: 4 }, (_, day) =>
        generateMovementRecommendation(signals({ phase: "menstrual", dayNumber: day })).primary.key,
      ),
    );
    expect(picks.size).toBeGreaterThan(1);
  });

  it("both primary and alternative always belong to the resolved tier", () => {
    const rec = generateMovementRecommendation(signals({ phase: "menstrual", hasCramps: true, dayNumber: 3 }));
    expect(rec.tier).toBe("gentle");
    expect(OPTIONS_BY_TIER.gentle.map((o) => o.key)).toContain(rec.primary.key);
    expect(OPTIONS_BY_TIER.gentle.map((o) => o.key)).toContain(rec.alternative.key);
  });

  it("duration matches the resolved tier", () => {
    const rec = generateMovementRecommendation(signals({ phase: "ovulation_window", dayNumber: 1 }));
    expect(rec.duration).toBe(DURATION_BY_TIER.vigorous);
  });
});

describe("generateMovementRecommendation — workout preferences break ties without overriding safety", () => {
  it("picks the preferred option when it fits today's tier", () => {
    for (let day = 0; day < 5; day++) {
      const rec = generateMovementRecommendation(
        signals({ phase: "menstrual", preferredTypes: ["yoga"], dayNumber: day }),
      );
      expect(rec.primary.key).toBe("yoga");
    }
  });

  it("ignores a preference that doesn't fit today's resolved tier, rather than recommending something unsafe", () => {
    // Preference is "running" (vigorous), but cramps force a gentle day.
    const rec = generateMovementRecommendation(
      signals({ phase: "ovulation_window", hasCramps: true, preferredTypes: ["running"], dayNumber: 2 }),
    );
    expect(rec.tier).toBe("gentle");
    expect(rec.primary.key).not.toBe("running");
    expect(OPTIONS_BY_TIER.gentle.map((o) => o.key)).toContain(rec.primary.key);
  });

  it("rotates among multiple preferred options that do fit the tier", () => {
    const picks = new Set(
      Array.from({ length: 4 }, (_, day) =>
        generateMovementRecommendation(
          signals({ phase: "menstrual", preferredTypes: ["yoga", "walking"], dayNumber: day }),
        ).primary.key,
      ),
    );
    expect([...picks].every((key) => key === "yoga" || key === "walking")).toBe(true);
  });
});

describe("getGentlerOption", () => {
  it("steps vigorous down to a moderate option", () => {
    const option = getGentlerOption("vigorous", 0);
    expect(OPTIONS_BY_TIER.moderate.map((o) => o.key)).toContain(option.key);
  });

  it("steps moderate down to a gentle option", () => {
    const option = getGentlerOption("moderate", 0);
    expect(OPTIONS_BY_TIER.gentle.map((o) => o.key)).toContain(option.key);
  });

  it("floors out at recovery/rest when already gentle", () => {
    expect(getGentlerOption("gentle", 0).key).toBe("recovery_rest");
    expect(getGentlerOption("gentle", 7).key).toBe("recovery_rest");
  });
});

describe("movement recommendation copy — no absolutist claims about how everyone responds", () => {
  // Negative lookbehind excludes the hedge itself ("not everyone feels...") —
  // it's the unqualified, absolutist form ("everyone feels...") that's banned.
  const FORBIDDEN = [
    /every woman/i,
    /all women/i,
    /always feel/i,
    /you will (definitely|always)/i,
    /(?<!not )everyone (feels|experiences)/i,
  ];

  it("phase-only and override reasoning avoid absolutist language", () => {
    const phases: CyclePhase[] = ["menstrual", "follicular", "ovulation_window", "luteal"];
    for (const phase of phases) {
      const rec = generateMovementRecommendation(signals({ phase, dayNumber: 0 }));
      for (const pattern of FORBIDDEN) {
        expect(rec.why).not.toMatch(pattern);
      }
    }
  });
});
