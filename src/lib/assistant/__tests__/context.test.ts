import { describe, expect, it } from "vitest";
import { calculateCycleInsights } from "@/lib/cycle-engine";
import { buildAssistantContext } from "../context";

const SYMPTOM_LABELS = { cramps: "Cramps", fatigue: "Fatigue", headache: "Headache" };

function cycleInsightsFixture(today: string) {
  return calculateCycleInsights({
    mostRecentPeriodStartDate: "2026-08-01",
    averageCycleLengthDays: 28,
    averagePeriodDurationDays: 5,
    cycleVariability: "regular",
    today,
  });
}

describe("buildAssistantContext", () => {
  it("reports no cycle data when the user hasn't logged a period yet", () => {
    const context = buildAssistantContext({
      cycleInsights: null,
      today: null,
      recentSymptomCounts: [],
      recentWindowDays: 14,
      symptomLabels: SYMPTOM_LABELS,
    });
    expect(context.hasCycleData).toBe(false);
    expect(context.phase).toBeNull();
    expect(context.cycleDay).toBeNull();
  });

  it("surfaces phase, cycle day, and average length from cycle insights", () => {
    const insights = cycleInsightsFixture("2026-08-05");
    const context = buildAssistantContext({
      cycleInsights: insights,
      today: null,
      recentSymptomCounts: [],
      recentWindowDays: 14,
      symptomLabels: SYMPTOM_LABELS,
    });
    expect(context.hasCycleData).toBe(true);
    expect(context.phase).toBe(insights.currentPhase);
    expect(context.cycleDay).toBe(insights.currentCycleDay);
    expect(context.averageCycleLengthDays).toBe(insights.effectiveCycleLengthDays);
    expect(context.phaseLabel).toMatch(/^Estimated/);
  });

  it("reports hasLoggedToday false and a null today block when nothing was logged", () => {
    const context = buildAssistantContext({
      cycleInsights: null,
      today: null,
      recentSymptomCounts: [],
      recentWindowDays: 14,
      symptomLabels: SYMPTOM_LABELS,
    });
    expect(context.hasLoggedToday).toBe(false);
    expect(context.today).toBeNull();
  });

  it("carries today's logged signals through unchanged", () => {
    const today = {
      flow: "medium" as const,
      energyLevel: 2,
      sleepQuality: 3,
      painSeverity: 4,
      mood: ["stressed" as const],
      symptomKeys: ["cramps"],
    };
    const context = buildAssistantContext({
      cycleInsights: null,
      today,
      recentSymptomCounts: [],
      recentWindowDays: 14,
      symptomLabels: SYMPTOM_LABELS,
    });
    expect(context.hasLoggedToday).toBe(true);
    expect(context.today).toEqual(today);
  });

  it("filters out zero-count symptoms and sorts the rest by frequency, most common first", () => {
    const context = buildAssistantContext({
      cycleInsights: null,
      today: null,
      recentSymptomCounts: [
        { symptomKey: "headache", count: 1 },
        { symptomKey: "cramps", count: 4 },
        { symptomKey: "fatigue", count: 0 },
      ],
      recentWindowDays: 14,
      symptomLabels: SYMPTOM_LABELS,
    });
    expect(context.recentSymptomFrequency.map((s) => s.key)).toEqual(["cramps", "headache"]);
    expect(context.recentSymptomFrequency[0]).toEqual({
      key: "cramps",
      label: "Cramps",
      daysLogged: 4,
      ofRecentDays: 14,
    });
  });

  it("falls back to the raw key as a label when no display label is known", () => {
    const context = buildAssistantContext({
      cycleInsights: null,
      today: null,
      recentSymptomCounts: [{ symptomKey: "mystery_symptom", count: 2 }],
      recentWindowDays: 14,
      symptomLabels: SYMPTOM_LABELS,
    });
    expect(context.recentSymptomFrequency[0].label).toBe("mystery_symptom");
  });
});
