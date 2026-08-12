import { describe, expect, it } from "vitest";
import { PREGNANCY_ASSISTANT_SAFETY_INSTRUCTIONS, buildPregnancyAssistantSystemPrompt } from "../prompt";
import type { PregnancyAssistantUserContext } from "../types";

function contextFixture(overrides: Partial<PregnancyAssistantUserContext> = {}): PregnancyAssistantUserContext {
  return {
    gestationalAgeWeeks: 22,
    gestationalAgeDays: 4,
    trimester: "second",
    estimatedDueDate: "2026-12-01",
    hasLoggedToday: true,
    today: { mood: ["stressed"], energyLevel: 2, sleepQuality: 3, symptomSeverities: { heartburn: "mild" } },
    recentSymptomFrequency: [{ key: "heartburn", label: "Heartburn", daysLogged: 4, ofRecentDays: 14 }],
    ...overrides,
  };
}

describe("PREGNANCY_ASSISTANT_SAFETY_INSTRUCTIONS content safety", () => {
  it("explicitly forbids diagnosing a pregnancy complication", () => {
    expect(PREGNANCY_ASSISTANT_SAFETY_INSTRUCTIONS).toMatch(/never diagnose a pregnancy complication/i);
  });

  it("explicitly forbids interpreting fetal health or ultrasound results", () => {
    expect(PREGNANCY_ASSISTANT_SAFETY_INSTRUCTIONS).toMatch(/never interpret fetal health, ultrasound results/i);
  });

  it("explicitly forbids individualized medication dosing", () => {
    expect(PREGNANCY_ASSISTANT_SAFETY_INSTRUCTIONS).toMatch(/never give individualized medication or supplement dosing/i);
  });

  it("explicitly forbids calling a severe symptom harmless", () => {
    expect(PREGNANCY_ASSISTANT_SAFETY_INSTRUCTIONS).toMatch(/never tell a user that a severe or concerning symptom is harmless/i);
  });

  it("explicitly forbids guaranteeing symptom normalcy or developmental milestones", () => {
    expect(PREGNANCY_ASSISTANT_SAFETY_INSTRUCTIONS).toMatch(/never guarantee whether a symptom is "normal"/i);
    expect(PREGNANCY_ASSISTANT_SAFETY_INSTRUCTIONS).toMatch(/guarantee any developmental milestone/i);
  });

  it("explicitly forbids predicting delivery with certainty", () => {
    expect(PREGNANCY_ASSISTANT_SAFETY_INSTRUCTIONS).toMatch(/never predict a delivery date, gestational timing, or labor outcome with certainty/i);
  });

  it("explicitly forbids determining whether labor is safe to manage at home", () => {
    expect(PREGNANCY_ASSISTANT_SAFETY_INSTRUCTIONS).toMatch(/never determine whether labor is safe to manage at home/i);
  });

  it("does not itself make absolutist claims", () => {
    expect(PREGNANCY_ASSISTANT_SAFETY_INSTRUCTIONS).not.toMatch(/\byou will\b/i);
    expect(PREGNANCY_ASSISTANT_SAFETY_INSTRUCTIONS).not.toMatch(/\balways happens\b/i);
  });
});

describe("buildPregnancyAssistantSystemPrompt", () => {
  it("always includes the fixed safety instructions verbatim", () => {
    const prompt = buildPregnancyAssistantSystemPrompt(contextFixture());
    expect(prompt).toContain(PREGNANCY_ASSISTANT_SAFETY_INSTRUCTIONS);
  });

  it("labels the due date as an estimate", () => {
    const prompt = buildPregnancyAssistantSystemPrompt(contextFixture());
    expect(prompt).toMatch(/estimated due date: 2026-12-01 \(this is an estimate, not a guarantee\)/i);
  });

  it("tells the model to only use context when relevant, not to force personalization", () => {
    const prompt = buildPregnancyAssistantSystemPrompt(contextFixture());
    expect(prompt).toMatch(/only when it's actually relevant/i);
  });

  it("includes today's logged signals when present", () => {
    const prompt = buildPregnancyAssistantSystemPrompt(contextFixture());
    expect(prompt).toMatch(/energy: 2\/5/);
    expect(prompt).toMatch(/mood: stressed/);
    expect(prompt).toMatch(/symptoms logged today: heartburn/);
  });

  it("does not fabricate today's signals when nothing was logged", () => {
    const prompt = buildPregnancyAssistantSystemPrompt(contextFixture({ today: null, hasLoggedToday: false }));
    expect(prompt).toMatch(/nothing logged yet today/i);
  });

  it("includes recent symptom frequency with the supporting day count", () => {
    const prompt = buildPregnancyAssistantSystemPrompt(contextFixture());
    expect(prompt).toMatch(/Heartburn \(4\/14 recent days\)/);
  });
});
