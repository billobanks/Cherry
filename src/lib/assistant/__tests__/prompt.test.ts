import { describe, expect, it } from "vitest";
import { ASSISTANT_SAFETY_INSTRUCTIONS, buildAssistantSystemPrompt } from "../prompt";
import type { AssistantUserContext } from "../types";

function contextFixture(overrides: Partial<AssistantUserContext> = {}): AssistantUserContext {
  return {
    hasCycleData: true,
    phase: "luteal",
    phaseLabel: "Estimated luteal phase",
    cycleDay: 22,
    averageCycleLengthDays: 28,
    hasLoggedToday: true,
    today: {
      flow: null,
      energyLevel: 2,
      sleepQuality: 3,
      painSeverity: null,
      mood: ["stressed"],
      symptomKeys: ["fatigue"],
    },
    recentSymptomFrequency: [{ key: "fatigue", label: "Fatigue", daysLogged: 4, ofRecentDays: 14 }],
    ...overrides,
  };
}

describe("ASSISTANT_SAFETY_INSTRUCTIONS content safety", () => {
  it("explicitly forbids diagnosing a condition", () => {
    expect(ASSISTANT_SAFETY_INSTRUCTIONS).toMatch(/never diagnose/i);
  });

  it("explicitly forbids claiming certainty about ovulation", () => {
    expect(ASSISTANT_SAFETY_INSTRUCTIONS).toMatch(/never claim certainty about ovulation/i);
  });

  it("explicitly forbids recommending prescription medication", () => {
    expect(ASSISTANT_SAFETY_INSTRUCTIONS).toMatch(/never recommend.*prescription/i);
  });

  it("explicitly forbids telling users to ignore concerning symptoms", () => {
    expect(ASSISTANT_SAFETY_INSTRUCTIONS).toMatch(/never tell a user to ignore/i);
  });

  it("instructs the model to distinguish education from a professional-care recommendation", () => {
    expect(ASSISTANT_SAFETY_INSTRUCTIONS).toMatch(/clearly separate general education from a recommendation to seek professional care/i);
    expect(ASSISTANT_SAFETY_INSTRUCTIONS).toMatch(/not medical advice/i);
  });

  it("does not claim everyone responds identically to hormonal changes", () => {
    expect(ASSISTANT_SAFETY_INSTRUCTIONS).not.toMatch(/(?<!not )everyone (feels|experiences|responds)/i);
    expect(ASSISTANT_SAFETY_INSTRUCTIONS).toMatch(/never claim every person's body responds identically/i);
  });

  it("does not itself make absolutist claims about the user", () => {
    expect(ASSISTANT_SAFETY_INSTRUCTIONS).not.toMatch(/\byou will\b/i);
    expect(ASSISTANT_SAFETY_INSTRUCTIONS).not.toMatch(/\balways happens\b/i);
  });
});

describe("buildAssistantSystemPrompt", () => {
  it("always includes the fixed safety instructions verbatim", () => {
    const prompt = buildAssistantSystemPrompt(contextFixture());
    expect(prompt).toContain(ASSISTANT_SAFETY_INSTRUCTIONS);
  });

  it("does not fabricate a phase or cycle day when the user has no cycle data", () => {
    const prompt = buildAssistantSystemPrompt(
      contextFixture({
        hasCycleData: false,
        phase: null,
        phaseLabel: null,
        cycleDay: null,
        averageCycleLengthDays: null,
        today: null,
        hasLoggedToday: false,
        recentSymptomFrequency: [],
      }),
    );
    expect(prompt).toMatch(/hasn't logged a period start date/i);
    expect(prompt).not.toMatch(/cycle day: \d/i);
  });

  it("hedges cycle phase as an estimate, never a confirmed fact", () => {
    const prompt = buildAssistantSystemPrompt(contextFixture());
    expect(prompt).toMatch(/estimate, not a confirmed fact/i);
  });

  it("tells the model to only use context when relevant, not to force personalization", () => {
    const prompt = buildAssistantSystemPrompt(contextFixture());
    expect(prompt).toMatch(/only when it's actually relevant/i);
  });

  it("includes today's logged signals when present", () => {
    const prompt = buildAssistantSystemPrompt(contextFixture());
    expect(prompt).toMatch(/energy: 2\/5/);
    expect(prompt).toMatch(/mood: stressed/);
  });

  it("includes recent symptom frequency with the supporting day count", () => {
    const prompt = buildAssistantSystemPrompt(contextFixture());
    expect(prompt).toMatch(/Fatigue \(4\/14 recent days\)/);
  });
});
