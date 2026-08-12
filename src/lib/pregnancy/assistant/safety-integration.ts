import { evaluatePregnancySafety } from "../safety-evaluate";
import type { PregnancySafetyAlert, PregnancySafetyRuleContent } from "../safety-types";
import type { PregnancyAssistantTodaySignals } from "./types";

/**
 * Runs today's logged signals through the same deterministic
 * PregnancySafetyEngine the daily check-in uses, rather than trusting the
 * AI model to remember and apply the safety rules on its own. Called BEFORE
 * the AI provider generates a reply (see actions.ts) — a concerning
 * combination surfaces as a rule-driven alert that ships alongside the
 * assistant's reply regardless of what the model says, and the system
 * prompt separately instructs the model never to contradict or soften a
 * concerning symptom. Belt-and-suspenders, matching the menstrual
 * assistant's `evaluateAssistantSafety`.
 */
export function evaluatePregnancyAssistantSafety(
  gestationalAgeWeeks: number,
  todaySignals: PregnancyAssistantTodaySignals | null,
  rules: PregnancySafetyRuleContent[],
): PregnancySafetyAlert[] {
  if (!todaySignals) return [];

  return evaluatePregnancySafety({ gestationalAgeWeeks, symptomSeverities: todaySignals.symptomSeverities }, rules);
}
