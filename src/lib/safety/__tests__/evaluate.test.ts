import { describe, expect, it } from "vitest";
import {
  evaluateSafetySignals,
  hasDizzinessWithHeavyBleeding,
  hasFainting,
  hasProlongedBleeding,
  hasUnusualBleedingPattern,
  isHeavyBleeding,
  isSevereOrWorseningPain,
} from "../evaluate";
import { SAFETY_RULE_KEYS } from "../catalog";
import type { SafetyCheckSignals, SafetyRuleContent } from "../types";

function baseSignals(overrides: Partial<SafetyCheckSignals> = {}): SafetyCheckSignals {
  return {
    flow: null,
    painSeverity: null,
    previousPainSeverity: null,
    symptomKeys: [],
    priorConsecutiveBleedingDays: 0,
    isOutsideExpectedBleedingWindow: false,
    ...overrides,
  };
}

function rule(overrides: Partial<SafetyRuleContent>): SafetyRuleContent {
  return {
    ruleKey: "heavy_bleeding",
    label: "Unusually heavy bleeding",
    severity: "routine",
    message: "Bleeding that's heavier than what's typical for you can have several possible causes.",
    active: true,
    params: {},
    ...overrides,
  };
}

describe("isHeavyBleeding", () => {
  it("fires on heavy flow", () => {
    expect(isHeavyBleeding(baseSignals({ flow: "heavy" }))).toBe(true);
  });
  it("does not fire on medium flow", () => {
    expect(isHeavyBleeding(baseSignals({ flow: "medium" }))).toBe(false);
  });
});

describe("isSevereOrWorseningPain", () => {
  it("fires when pain is at the top of the scale", () => {
    expect(isSevereOrWorseningPain(baseSignals({ painSeverity: 5 }))).toBe(true);
  });
  it("does not fire on moderate pain with no prior reading", () => {
    expect(isSevereOrWorseningPain(baseSignals({ painSeverity: 3 }))).toBe(false);
  });
  it("fires on a rapid jump even if not at the top of the scale", () => {
    expect(
      isSevereOrWorseningPain(baseSignals({ painSeverity: 4, previousPainSeverity: 1 })),
    ).toBe(true);
  });
  it("does not fire on a gradual increase", () => {
    expect(
      isSevereOrWorseningPain(baseSignals({ painSeverity: 3, previousPainSeverity: 2 })),
    ).toBe(false);
  });
  it("does not fire when pain wasn't logged", () => {
    expect(isSevereOrWorseningPain(baseSignals({ painSeverity: null, previousPainSeverity: 1 }))).toBe(
      false,
    );
  });
});

describe("hasFainting", () => {
  it("fires when fainting is logged as a symptom", () => {
    expect(hasFainting(baseSignals({ symptomKeys: ["fainting"] }))).toBe(true);
  });
  it("does not fire otherwise", () => {
    expect(hasFainting(baseSignals({ symptomKeys: ["cramps", "fatigue"] }))).toBe(false);
  });
});

describe("hasDizzinessWithHeavyBleeding", () => {
  it("fires only when dizziness AND heavy flow are both present", () => {
    expect(
      hasDizzinessWithHeavyBleeding(baseSignals({ symptomKeys: ["dizziness"], flow: "heavy" })),
    ).toBe(true);
  });
  it("does not fire on dizziness alone", () => {
    expect(
      hasDizzinessWithHeavyBleeding(baseSignals({ symptomKeys: ["dizziness"], flow: "light" })),
    ).toBe(false);
  });
  it("does not fire on heavy bleeding alone", () => {
    expect(hasDizzinessWithHeavyBleeding(baseSignals({ symptomKeys: [], flow: "heavy" }))).toBe(false);
  });
});

describe("hasUnusualBleedingPattern", () => {
  it("fires when bleeding is logged outside the expected window", () => {
    expect(
      hasUnusualBleedingPattern(baseSignals({ flow: "spotting", isOutsideExpectedBleedingWindow: true })),
    ).toBe(true);
  });
  it("does not fire when there's no bleeding today", () => {
    expect(
      hasUnusualBleedingPattern(baseSignals({ flow: "none", isOutsideExpectedBleedingWindow: true })),
    ).toBe(false);
  });
  it("does not fire when the window is expected", () => {
    expect(
      hasUnusualBleedingPattern(baseSignals({ flow: "medium", isOutsideExpectedBleedingWindow: false })),
    ).toBe(false);
  });
});

describe("hasProlongedBleeding", () => {
  it("fires once prior days plus today reach the threshold", () => {
    expect(hasProlongedBleeding(baseSignals({ flow: "light", priorConsecutiveBleedingDays: 7 }), 8)).toBe(
      true,
    );
  });
  it("does not fire below the threshold", () => {
    expect(hasProlongedBleeding(baseSignals({ flow: "light", priorConsecutiveBleedingDays: 5 }), 8)).toBe(
      false,
    );
  });
  it("does not fire when today has no bleeding, even with a long prior streak", () => {
    expect(hasProlongedBleeding(baseSignals({ flow: "none", priorConsecutiveBleedingDays: 10 }), 8)).toBe(
      false,
    );
  });
  it("respects a configurable, lower threshold", () => {
    expect(hasProlongedBleeding(baseSignals({ flow: "light", priorConsecutiveBleedingDays: 3 }), 4)).toBe(
      true,
    );
  });
});

describe("evaluateSafetySignals", () => {
  it("returns no alerts when nothing concerning was reported", () => {
    const alerts = evaluateSafetySignals(baseSignals(), [rule({})]);
    expect(alerts).toEqual([]);
  });

  it("returns a composed alert with the severity call-to-action appended", () => {
    const alerts = evaluateSafetySignals(baseSignals({ flow: "heavy" }), [rule({})]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].message).toContain("can have several possible causes");
    expect(alerts[0].message).toContain("consider contacting a healthcare professional");
  });

  it("uses the urgent call-to-action for urgent rules", () => {
    const alerts = evaluateSafetySignals(baseSignals({ symptomKeys: ["fainting"] }), [
      rule({ ruleKey: "fainting", severity: "urgent", message: "Fainting can have several possible causes." }),
    ]);
    expect(alerts[0].message).toContain("seek timely medical care");
  });

  it("skips an inactive rule even when its signal matches", () => {
    const alerts = evaluateSafetySignals(baseSignals({ flow: "heavy" }), [rule({ active: false })]);
    expect(alerts).toEqual([]);
  });

  it("respects a rule's configurable params (prolonged bleeding threshold)", () => {
    const signals = baseSignals({ flow: "light", priorConsecutiveBleedingDays: 3 });
    const rules = [
      rule({
        ruleKey: "prolonged_bleeding",
        message: "Bleeding that continues longer than what's typical for you can have several possible causes.",
        params: { thresholdDays: 4 },
      }),
    ];
    expect(evaluateSafetySignals(signals, rules)).toHaveLength(1);
  });

  it("can trigger multiple rules at once and sorts urgent alerts first", () => {
    const signals = baseSignals({ flow: "heavy", symptomKeys: ["dizziness"] });
    const rules = [
      rule({ ruleKey: "heavy_bleeding", severity: "routine" }),
      rule({
        ruleKey: "dizziness_with_heavy_bleeding",
        severity: "urgent",
        message: "Feeling dizzy along with heavier bleeding can have several possible causes.",
      }),
    ];
    const alerts = evaluateSafetySignals(signals, rules);
    expect(alerts).toHaveLength(2);
    expect(alerts[0].severity).toBe("urgent");
    expect(alerts[1].severity).toBe("routine");
  });

  it("every rule key has a wired-up detector", () => {
    // Every rule key must be able to fire under *some* signal combination —
    // guards against a rule key being added to the type without wiring its
    // detector into the composer.
    const symptomTrigger = baseSignals({ symptomKeys: ["fainting", "dizziness"], flow: "heavy" });
    const painTrigger = baseSignals({ painSeverity: 5 });
    const patternTrigger = baseSignals({ flow: "spotting", isOutsideExpectedBleedingWindow: true });
    const prolongedTrigger = baseSignals({ flow: "light", priorConsecutiveBleedingDays: 10 });

    for (const ruleKey of SAFETY_RULE_KEYS) {
      const anyFired = [symptomTrigger, painTrigger, patternTrigger, prolongedTrigger].some((signals) =>
        evaluateSafetySignals(signals, [rule({ ruleKey })]).length > 0,
      );
      expect(anyFired, `expected some signal combination to trigger ${ruleKey}`).toBe(true);
    }
  });

  it("does not diagnose a specific condition in the composed message", () => {
    const conditionNamePattern = /\b(endometriosis|fibroids?|pcos|cancer|miscarriage|ectopic)\b/i;
    for (const ruleKey of SAFETY_RULE_KEYS) {
      const alerts = evaluateSafetySignals(baseSignals({ flow: "heavy", symptomKeys: ["fainting", "dizziness"], painSeverity: 5 }), [
        rule({ ruleKey }),
      ]);
      for (const alert of alerts) {
        expect(alert.message).not.toMatch(conditionNamePattern);
        expect(alert.message).not.toMatch(/this (means|is caused by|is a sign of)/i);
        expect(alert.message).not.toMatch(/you (have|are experiencing) a\b/i);
      }
    }
  });

  it("hedges with 'can have several possible causes' rather than asserting a cause", () => {
    const alerts = evaluateSafetySignals(baseSignals({ flow: "heavy" }), [rule({})]);
    expect(alerts[0].message).toMatch(/can have (several|many) possible causes/i);
  });
});
