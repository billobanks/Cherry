import type { SafetyRuleKey, SafetyRuleSeverity } from "./types";

export const SAFETY_RULE_KEYS: SafetyRuleKey[] = [
  "heavy_bleeding",
  "severe_or_worsening_pain",
  "fainting",
  "dizziness_with_heavy_bleeding",
  "unusual_bleeding_pattern",
  "prolonged_bleeding",
];

/**
 * The escalation call-to-action is fixed in code rather than stored in
 * `safety_rules`, so a medically reviewed rule's urgency can't be silently
 * softened (or its escalation language forgotten) by a text edit — only by
 * deliberately changing `severity`, which is its own reviewable field.
 */
export const SEVERITY_CALL_TO_ACTION: Record<SafetyRuleSeverity, string> = {
  routine:
    "Because that sounds like more than typical cycle discomfort, consider contacting a healthcare professional.",
  urgent:
    "Because that sounds like more than typical cycle discomfort, it's a good idea to seek timely medical care.",
};

/** Used when a rule's `params.thresholdDays` isn't set. */
export const DEFAULT_PROLONGED_BLEEDING_THRESHOLD_DAYS = 8;

/** Pain severity (1–5 scale) at or above this counts as "severe". */
export const SEVERE_PAIN_THRESHOLD = 5;

/** A day-over-day pain jump of at least this much counts as "rapidly worsening". */
export const RAPID_PAIN_INCREASE_THRESHOLD = 2;
