import type { CheckinFlow, SafetyRuleKey, SafetyRuleSeverity } from "@/types/database";

export type { SafetyRuleKey, SafetyRuleSeverity };

/** What today's check-in (plus a little recent history) looks like to the safety engine. */
export interface SafetyCheckSignals {
  flow: CheckinFlow | null;
  painSeverity: number | null;
  /** Yesterday's logged pain severity, if any — used to detect a rapid jump. */
  previousPainSeverity: number | null;
  symptomKeys: string[];
  /** Consecutive bleeding days ending yesterday (not counting today). */
  priorConsecutiveBleedingDays: number;
  /** True when today falls in a phase window where bleeding isn't typically expected. */
  isOutsideExpectedBleedingWindow: boolean;
}

/** A safety rule's admin-managed content, as read from `safety_rules`. */
export interface SafetyRuleContent {
  ruleKey: SafetyRuleKey;
  label: string;
  severity: SafetyRuleSeverity;
  /** Non-diagnostic context sentence only — the call-to-action is appended separately. */
  message: string;
  active: boolean;
  params: Record<string, number | string | boolean>;
}

/** A triggered rule, fully composed and ready to show the user. */
export interface SafetyAlert {
  ruleKey: SafetyRuleKey;
  severity: SafetyRuleSeverity;
  label: string;
  message: string;
}
