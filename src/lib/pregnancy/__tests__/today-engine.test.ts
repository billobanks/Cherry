import { describe, expect, it } from "vitest";
import { calculatePregnancyDating } from "../dating-engine";
import { buildPregnancyToday } from "../today-engine";
import type { PregnancySafetyAlert } from "../safety-types";

function datingFixture(gestationalAgeDaysAgo: number) {
  const dueDate = "2026-12-01";
  return calculatePregnancyDating({
    clinicianEstimatedDueDate: dueDate,
    today: new Date(new Date(dueDate).getTime() - (280 - gestationalAgeDaysAgo) * 86400000)
      .toISOString()
      .slice(0, 10),
  });
}

describe("buildPregnancyToday", () => {
  it("falls back to generic trimester content when no week content is published", () => {
    const output = buildPregnancyToday({
      dating: datingFixture(129), // 18w3d, second trimester
      today: null,
      publishedWeekContent: {},
      safetyAlerts: [],
    });
    expect(output.babyDevelopment.length).toBeGreaterThan(0);
    expect(output.bodyChanges.length).toBeGreaterThan(0);
    expect(output.trimester).toBe("second");
  });

  it("prefers published week content over the generic fallback when available", () => {
    const output = buildPregnancyToday({
      dating: datingFixture(129),
      today: null,
      publishedWeekContent: { baby_development: "Specific, medically reviewed week-18 content." },
      safetyAlerts: [],
    });
    expect(output.babyDevelopment).toBe("Specific, medically reviewed week-18 content.");
  });

  it("computes percentComplete against a 280-day term", () => {
    const output = buildPregnancyToday({
      dating: datingFixture(140), // exactly half of 280
      today: null,
      publishedWeekContent: {},
      safetyAlerts: [],
    });
    expect(output.percentComplete).toBe(50);
  });

  it("reports safetyStatus clear when there are no alerts", () => {
    const output = buildPregnancyToday({ dating: datingFixture(100), today: null, publishedWeekContent: {}, safetyAlerts: [] });
    expect(output.safetyStatus).toBe("clear");
  });

  it("reports safetyStatus urgent when any alert is urgent", () => {
    const alerts: PregnancySafetyAlert[] = [
      { ruleKey: "fever", severity: "urgent", label: "Fever", message: "..." },
      { ruleKey: "heavy_bleeding", severity: "urgent", label: "Heavy bleeding", message: "..." },
    ];
    const output = buildPregnancyToday({ dating: datingFixture(100), today: null, publishedWeekContent: {}, safetyAlerts: alerts });
    expect(output.safetyStatus).toBe("urgent");
  });

  it("reports safetyStatus routine when alerts exist but none are urgent", () => {
    const alerts: PregnancySafetyAlert[] = [
      { ruleKey: "fever", severity: "routine", label: "Fever", message: "..." },
    ];
    const output = buildPregnancyToday({ dating: datingFixture(100), today: null, publishedWeekContent: {}, safetyAlerts: alerts });
    expect(output.safetyStatus).toBe("routine");
  });

  it("prompts to log a check-in when nothing was logged today", () => {
    const output = buildPregnancyToday({ dating: datingFixture(50), today: null, publishedWeekContent: {}, safetyAlerts: [] });
    expect(output.todayInsight).toMatch(/log today's check-in/i);
  });

  it("surfaces symptom education only for symptoms actually logged today", () => {
    const output = buildPregnancyToday({
      dating: datingFixture(50),
      today: {
        mood: [],
        energyLevel: null,
        sleepQuality: null,
        hydrationLevel: null,
        appetiteLevel: null,
        symptoms: { heartburn: "mild" },
      },
      publishedWeekContent: {},
      safetyAlerts: [],
    });
    expect(output.symptomEducation).toHaveLength(1);
    expect(output.symptomEducation[0].key).toBe("heartburn");
  });

  it("splits published questions-for-provider content on newlines", () => {
    const output = buildPregnancyToday({
      dating: datingFixture(50),
      today: null,
      publishedWeekContent: { questions_for_provider: "Question one?\nQuestion two?" },
      safetyAlerts: [],
    });
    expect(output.questionsForProvider).toEqual(["Question one?", "Question two?"]);
  });

  it("never claims a guaranteed development milestone or delivery date", () => {
    const output = buildPregnancyToday({ dating: datingFixture(50), today: null, publishedWeekContent: {}, safetyAlerts: [] });
    expect(output.babyDevelopment).not.toMatch(/\bwill\b/i);
    expect(output.bodyChanges).not.toMatch(/\balways\b/i);
  });
});
