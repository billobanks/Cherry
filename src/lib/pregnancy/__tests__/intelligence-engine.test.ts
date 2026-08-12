import { describe, expect, it } from "vitest";
import { calculatePregnancyDating } from "../dating-engine";
import { buildPregnancyIntelligence } from "../intelligence-engine";
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

describe("buildPregnancyIntelligence", () => {
  it("reports week, day, and trimester as a plain number", () => {
    const output = buildPregnancyIntelligence({
      dating: datingFixture(129), // 18w3d, second trimester
      today: null,
      publishedWeekContent: {},
      patternSentences: [],
      focusAreas: [],
      safetyAlerts: [],
    });
    expect(output.pregnancy.week).toBe(18);
    expect(output.pregnancy.day).toBe(3);
    expect(output.pregnancy.trimester).toBe(2);
  });

  it("falls back to generic trimester content for baby/body when nothing is published", () => {
    const output = buildPregnancyIntelligence({
      dating: datingFixture(129),
      today: null,
      publishedWeekContent: {},
      patternSentences: [],
      focusAreas: [],
      safetyAlerts: [],
    });
    expect(output.baby.development.length).toBeGreaterThan(0);
    expect(output.baby.developmentDetails.length).toBeGreaterThan(0);
    expect(output.mother.bodyChanges.length).toBeGreaterThan(0);
    expect(output.mother.commonExperiences.length).toBeGreaterThan(0);
  });

  it("prefers published content over the generic fallback", () => {
    const output = buildPregnancyIntelligence({
      dating: datingFixture(129),
      today: null,
      publishedWeekContent: { baby_development: "Reviewed week-18 baby content." },
      patternSentences: [],
      focusAreas: [],
      safetyAlerts: [],
    });
    expect(output.baby.development).toBe("Reviewed week-18 baby content.");
  });

  it("answers 'why might I be feeling this way' only for symptoms actually logged today", () => {
    const output = buildPregnancyIntelligence({
      dating: datingFixture(50),
      today: { mood: [], energyLevel: null, sleepQuality: null, symptoms: { heartburn: "moderate" } },
      publishedWeekContent: {},
      patternSentences: [],
      focusAreas: [],
      safetyAlerts: [],
    });
    expect(output.personalized.basedOnUserLogs).toHaveLength(1);
    expect(output.personalized.basedOnUserLogs[0]).toMatch(/heartburn/i);
  });

  it("excludes safety-relevant symptoms (fever, vision changes, fluid leaking) from the reassuring explanation list", () => {
    const output = buildPregnancyIntelligence({
      dating: datingFixture(50),
      today: { mood: [], energyLevel: null, sleepQuality: null, symptoms: { fever: "moderate", vision_changes: "moderate", fluid_leaking: "moderate" } },
      publishedWeekContent: {},
      patternSentences: [],
      focusAreas: [],
      safetyAlerts: [],
    });
    expect(output.personalized.basedOnUserLogs).toHaveLength(0);
  });

  it("returns nothing personalized when nothing was logged today", () => {
    const output = buildPregnancyIntelligence({
      dating: datingFixture(50),
      today: null,
      publishedWeekContent: {},
      patternSentences: [],
      focusAreas: [],
      safetyAlerts: [],
    });
    expect(output.personalized.basedOnUserLogs).toEqual([]);
  });

  it("passes through pattern sentences verbatim", () => {
    const output = buildPregnancyIntelligence({
      dating: datingFixture(50),
      today: null,
      publishedWeekContent: {},
      patternSentences: [{ key: "energy_trend", sentence: "Your energy has generally been higher this week than last week." }],
      focusAreas: [],
      safetyAlerts: [],
    });
    expect(output.personalized.patterns).toEqual(["Your energy has generally been higher this week than last week."]);
  });

  it("reports safety level NORMAL when there are no alerts", () => {
    const output = buildPregnancyIntelligence({
      dating: datingFixture(50),
      today: null,
      publishedWeekContent: {},
      patternSentences: [],
      focusAreas: [],
      safetyAlerts: [],
    });
    expect(output.safety.level).toBe("NORMAL");
    expect(output.safety.message.length).toBeGreaterThan(0);
  });

  it("reports safety level URGENT and surfaces the urgent alert's message when any alert is urgent", () => {
    const alerts: PregnancySafetyAlert[] = [
      { ruleKey: "fever", severity: "routine", label: "Fever", message: "Routine message." },
      { ruleKey: "heavy_bleeding", severity: "urgent", label: "Heavy bleeding", message: "Urgent message." },
    ];
    const output = buildPregnancyIntelligence({
      dating: datingFixture(50),
      today: null,
      publishedWeekContent: {},
      patternSentences: [],
      focusAreas: [],
      safetyAlerts: alerts,
    });
    expect(output.safety.level).toBe("URGENT");
    expect(output.safety.message).toBe("Urgent message.");
  });

  it("reports safety level CONTACT_PROVIDER when alerts exist but none are urgent", () => {
    const alerts: PregnancySafetyAlert[] = [{ ruleKey: "fever", severity: "routine", label: "Fever", message: "Routine message." }];
    const output = buildPregnancyIntelligence({
      dating: datingFixture(50),
      today: null,
      publishedWeekContent: {},
      patternSentences: [],
      focusAreas: [],
      safetyAlerts: alerts,
    });
    expect(output.safety.level).toBe("CONTACT_PROVIDER");
  });

  it("never diagnoses a condition or claims a guaranteed outcome", () => {
    const output = buildPregnancyIntelligence({
      dating: datingFixture(50),
      today: { mood: [], energyLevel: 1, sleepQuality: 1, symptoms: { nausea: "severe", back_discomfort: "moderate" } },
      publishedWeekContent: {},
      patternSentences: [],
      focusAreas: [],
      safetyAlerts: [],
    });
    const allText = JSON.stringify(output);
    expect(allText).not.toMatch(/preeclampsia|placental abruption|miscarriage|preterm birth|infection/i);
    expect(output.baby.development).not.toMatch(/\bwill\b/i);
    expect(output.mother.bodyChanges.join(" ")).not.toMatch(/\balways\b/i);
  });

  it("orders based-on-user-logs by severity, most severe first", () => {
    const output = buildPregnancyIntelligence({
      dating: datingFixture(50),
      today: { mood: [], energyLevel: null, sleepQuality: null, symptoms: { bloating: "mild", nausea: "severe" } },
      publishedWeekContent: {},
      patternSentences: [],
      focusAreas: [],
      safetyAlerts: [],
    });
    expect(output.personalized.basedOnUserLogs[0]).toMatch(/nausea/i);
  });

  it("includes topics to learn for the current trimester", () => {
    const output = buildPregnancyIntelligence({
      dating: datingFixture(300), // third trimester
      today: null,
      publishedWeekContent: {},
      patternSentences: [],
      focusAreas: [],
      safetyAlerts: [],
    });
    expect(output.upcoming.topicsToLearn.length).toBeGreaterThan(0);
    expect(output.pregnancy.trimester).toBe(3);
  });
});
