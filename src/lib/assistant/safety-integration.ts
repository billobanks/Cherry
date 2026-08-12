import { evaluateSafetySignals } from "@/lib/safety";
import type { SafetyAlert, SafetyHistoryContext, SafetyRuleContent } from "@/lib/safety";
import type { AssistantTodaySignals } from "./types";

/**
 * Runs today's logged signals through the same deterministic safety-rule
 * engine the check-in page uses (`@/lib/safety`), rather than trusting the
 * AI model to remember and apply the safety rules on its own. A concerning
 * combination (e.g. heavy bleeding + dizziness) surfaces as a rule-driven
 * alert alongside the assistant's reply regardless of what the model says —
 * belt-and-suspenders on top of the system prompt's own instructions.
 */
export function evaluateAssistantSafety(
  todaySignals: AssistantTodaySignals | null,
  history: SafetyHistoryContext,
  rules: SafetyRuleContent[],
): SafetyAlert[] {
  if (!todaySignals) return [];

  return evaluateSafetySignals(
    {
      flow: todaySignals.flow,
      painSeverity: todaySignals.painSeverity,
      previousPainSeverity: history.previousPainSeverity,
      symptomKeys: todaySignals.symptomKeys,
      priorConsecutiveBleedingDays: history.priorConsecutiveBleedingDays,
      isOutsideExpectedBleedingWindow: history.isOutsideExpectedBleedingWindow,
    },
    rules,
  );
}
