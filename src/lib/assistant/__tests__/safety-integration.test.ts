import { describe, expect, it } from "vitest";
import type { SafetyHistoryContext, SafetyRuleContent } from "@/lib/safety";
import { evaluateAssistantSafety } from "../safety-integration";
import type { AssistantTodaySignals } from "../types";

const NEUTRAL_HISTORY: SafetyHistoryContext = {
  previousPainSeverity: null,
  priorConsecutiveBleedingDays: 0,
  isOutsideExpectedBleedingWindow: false,
};

const RULES: SafetyRuleContent[] = [
  {
    ruleKey: "dizziness_with_heavy_bleeding",
    label: "Dizziness with heavy bleeding",
    severity: "urgent",
    message: "Feeling dizzy along with heavier bleeding can have several possible causes.",
    active: true,
    params: {},
  },
  {
    ruleKey: "heavy_bleeding",
    label: "Unusually heavy bleeding",
    severity: "routine",
    message: "Bleeding that's heavier than what's typical for you can have several possible causes.",
    active: true,
    params: {},
  },
];

function todaySignals(overrides: Partial<AssistantTodaySignals> = {}): AssistantTodaySignals {
  return {
    flow: null,
    energyLevel: null,
    sleepQuality: null,
    painSeverity: null,
    mood: [],
    symptomKeys: [],
    ...overrides,
  };
}

describe("evaluateAssistantSafety", () => {
  it("returns no alerts when nothing was logged today", () => {
    expect(evaluateAssistantSafety(null, NEUTRAL_HISTORY, RULES)).toEqual([]);
  });

  it("returns no alerts when today's signals don't match any rule", () => {
    const alerts = evaluateAssistantSafety(todaySignals({ flow: "light" }), NEUTRAL_HISTORY, RULES);
    expect(alerts).toEqual([]);
  });

  it("fires the urgent rule when heavy bleeding and dizziness are both logged today", () => {
    const alerts = evaluateAssistantSafety(
      todaySignals({ flow: "heavy", symptomKeys: ["dizziness"] }),
      NEUTRAL_HISTORY,
      RULES,
    );
    expect(alerts).toHaveLength(2);
    expect(alerts[0].severity).toBe("urgent");
    expect(alerts[0].ruleKey).toBe("dizziness_with_heavy_bleeding");
  });

  it("carries history context (e.g. a prior day's pain reading) into the evaluation", () => {
    const painRule: SafetyRuleContent[] = [
      {
        ruleKey: "severe_or_worsening_pain",
        label: "Severe or rapidly worsening pain",
        severity: "urgent",
        message: "Pain that's getting noticeably worse can have several possible causes.",
        active: true,
        params: {},
      },
    ];
    const alerts = evaluateAssistantSafety(
      todaySignals({ painSeverity: 4 }),
      { ...NEUTRAL_HISTORY, previousPainSeverity: 1 },
      painRule,
    );
    expect(alerts).toHaveLength(1);
  });
});
