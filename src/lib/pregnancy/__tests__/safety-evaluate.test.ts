import { describe, expect, it } from "vitest";
import {
  evaluatePregnancySafety,
  hasFever,
  hasFluidLeaking,
  hasReducedFetalMovement,
  hasSevereHeadacheWithVisionChanges,
  hasSevereSwellingWithHeadache,
  hasSevereVomiting,
  hasSignsOfPretermLabor,
  isHeavyBleeding,
  isSevereAbdominalPain,
} from "../safety-evaluate";
import { PREGNANCY_SAFETY_RULE_KEYS } from "../safety-catalog";
import type { PregnancySafetyCheckSignals, PregnancySafetyRuleContent } from "../safety-types";

function signals(overrides: Partial<PregnancySafetyCheckSignals> = {}): PregnancySafetyCheckSignals {
  return {
    gestationalAgeWeeks: 20,
    symptomSeverities: {},
    ...overrides,
  };
}

function rule(overrides: Partial<PregnancySafetyRuleContent>): PregnancySafetyRuleContent {
  return {
    ruleKey: "fever",
    label: "Fever",
    severity: "urgent",
    message: "A fever during pregnancy can have several possible causes.",
    active: true,
    params: {},
    ...overrides,
  };
}

describe("individual detectors", () => {
  it("isHeavyBleeding fires only on severe spotting/bleeding", () => {
    expect(isHeavyBleeding(signals({ symptomSeverities: { spotting_bleeding: "severe" } }))).toBe(true);
    expect(isHeavyBleeding(signals({ symptomSeverities: { spotting_bleeding: "mild" } }))).toBe(false);
  });

  it("isSevereAbdominalPain fires on severe cramping or severe pelvic discomfort", () => {
    expect(isSevereAbdominalPain(signals({ symptomSeverities: { cramping: "severe" } }))).toBe(true);
    expect(isSevereAbdominalPain(signals({ symptomSeverities: { pelvic_discomfort: "severe" } }))).toBe(true);
    expect(isSevereAbdominalPain(signals({ symptomSeverities: { cramping: "mild" } }))).toBe(false);
  });

  it("hasSevereHeadacheWithVisionChanges requires both together", () => {
    expect(
      hasSevereHeadacheWithVisionChanges(
        signals({ symptomSeverities: { headache: "severe", vision_changes: "mild" } }),
      ),
    ).toBe(true);
    expect(hasSevereHeadacheWithVisionChanges(signals({ symptomSeverities: { headache: "severe" } }))).toBe(false);
    expect(hasSevereHeadacheWithVisionChanges(signals({ symptomSeverities: { vision_changes: "mild" } }))).toBe(
      false,
    );
  });

  it("hasReducedFetalMovement only applies from the third-trimester movement-counting window on", () => {
    expect(
      hasReducedFetalMovement(signals({ gestationalAgeWeeks: 30, symptomSeverities: { fetal_movement: "mild" } })),
    ).toBe(true);
    expect(
      hasReducedFetalMovement(signals({ gestationalAgeWeeks: 20, symptomSeverities: { fetal_movement: "mild" } })),
    ).toBe(false);
  });

  it("hasSignsOfPretermLabor only fires before 37 weeks", () => {
    expect(
      hasSignsOfPretermLabor(signals({ gestationalAgeWeeks: 32, symptomSeverities: { contractions: "mild" } })),
    ).toBe(true);
    expect(
      hasSignsOfPretermLabor(signals({ gestationalAgeWeeks: 39, symptomSeverities: { contractions: "mild" } })),
    ).toBe(false);
  });

  it("hasSignsOfPretermLabor also fires on fluid leaking or severe pelvic discomfort pre-term", () => {
    expect(hasSignsOfPretermLabor(signals({ gestationalAgeWeeks: 30, symptomSeverities: { fluid_leaking: "mild" } }))).toBe(
      true,
    );
    expect(
      hasSignsOfPretermLabor(signals({ gestationalAgeWeeks: 30, symptomSeverities: { pelvic_discomfort: "severe" } })),
    ).toBe(true);
  });

  it("hasSevereSwellingWithHeadache requires both together", () => {
    expect(
      hasSevereSwellingWithHeadache(signals({ symptomSeverities: { swelling: "severe", headache: "mild" } })),
    ).toBe(true);
    expect(hasSevereSwellingWithHeadache(signals({ symptomSeverities: { swelling: "severe" } }))).toBe(false);
  });

  it("hasFever fires whenever fever is logged, regardless of severity", () => {
    expect(hasFever(signals({ symptomSeverities: { fever: "mild" } }))).toBe(true);
  });

  it("hasSevereVomiting fires only at severe severity", () => {
    expect(hasSevereVomiting(signals({ symptomSeverities: { vomiting: "moderate" } }))).toBe(false);
    expect(hasSevereVomiting(signals({ symptomSeverities: { vomiting: "severe" } }))).toBe(true);
  });

  it("hasFluidLeaking fires whenever logged", () => {
    expect(hasFluidLeaking(signals({ symptomSeverities: { fluid_leaking: "mild" } }))).toBe(true);
  });
});

describe("evaluatePregnancySafety", () => {
  it("returns no alerts when nothing concerning was logged", () => {
    expect(evaluatePregnancySafety(signals(), [rule({})])).toEqual([]);
  });

  it("composes the severity call-to-action onto the message", () => {
    const alerts = evaluatePregnancySafety(signals({ symptomSeverities: { fever: "moderate" } }), [rule({})]);
    expect(alerts[0].message).toContain("contact your prenatal care provider");
  });

  it("skips an inactive rule even when its signal matches", () => {
    const alerts = evaluatePregnancySafety(signals({ symptomSeverities: { fever: "moderate" } }), [
      rule({ active: false }),
    ]);
    expect(alerts).toEqual([]);
  });

  it("every declared rule key has a wired-up detector that can fire", () => {
    const fixtures: PregnancySafetyCheckSignals[] = [
      signals({ symptomSeverities: { spotting_bleeding: "severe" } }),
      signals({ symptomSeverities: { cramping: "severe" } }),
      signals({ symptomSeverities: { headache: "severe", vision_changes: "mild" } }),
      signals({ gestationalAgeWeeks: 30, symptomSeverities: { fetal_movement: "mild" } }),
      signals({ gestationalAgeWeeks: 30, symptomSeverities: { contractions: "mild" } }),
      signals({ symptomSeverities: { swelling: "severe", headache: "mild" } }),
      signals({ symptomSeverities: { fever: "mild" } }),
      signals({ symptomSeverities: { vomiting: "severe" } }),
      signals({ symptomSeverities: { fluid_leaking: "mild" } }),
    ];

    for (const ruleKey of PREGNANCY_SAFETY_RULE_KEYS) {
      const anyFired = fixtures.some(
        (s) => evaluatePregnancySafety(s, [rule({ ruleKey })]).length > 0,
      );
      expect(anyFired, `expected some signal combination to trigger ${ruleKey}`).toBe(true);
    }
  });

  it("does not diagnose a specific condition in the composed message", () => {
    const conditionPattern = /\b(preeclampsia|placental abruption|miscarriage|preterm birth|infection)\b/i;
    const signalSet = signals({
      symptomSeverities: { fever: "severe", swelling: "severe", headache: "severe", vision_changes: "severe" },
    });
    for (const ruleKey of PREGNANCY_SAFETY_RULE_KEYS) {
      const alerts = evaluatePregnancySafety(signalSet, [rule({ ruleKey })]);
      for (const alert of alerts) {
        expect(alert.message).not.toMatch(conditionPattern);
        expect(alert.message).not.toMatch(/this (means|is caused by|is a sign of)/i);
      }
    }
  });
});
