import {
  DEFAULT_PROLONGED_BLEEDING_THRESHOLD_DAYS,
  RAPID_PAIN_INCREASE_THRESHOLD,
  SEVERE_PAIN_THRESHOLD,
  SEVERITY_CALL_TO_ACTION,
} from "./catalog";
import type { SafetyAlert, SafetyCheckSignals, SafetyRuleContent, SafetyRuleKey } from "./types";

function isBleedingFlow(flow: SafetyCheckSignals["flow"]): boolean {
  return flow != null && flow !== "none";
}

export function isHeavyBleeding(signals: SafetyCheckSignals): boolean {
  return signals.flow === "heavy";
}

export function isSevereOrWorseningPain(signals: SafetyCheckSignals): boolean {
  if (signals.painSeverity == null) return false;
  if (signals.painSeverity >= SEVERE_PAIN_THRESHOLD) return true;
  if (signals.previousPainSeverity == null) return false;
  return signals.painSeverity - signals.previousPainSeverity >= RAPID_PAIN_INCREASE_THRESHOLD;
}

export function hasFainting(signals: SafetyCheckSignals): boolean {
  return signals.symptomKeys.includes("fainting");
}

export function hasDizzinessWithHeavyBleeding(signals: SafetyCheckSignals): boolean {
  return signals.symptomKeys.includes("dizziness") && signals.flow === "heavy";
}

export function hasUnusualBleedingPattern(signals: SafetyCheckSignals): boolean {
  return signals.isOutsideExpectedBleedingWindow && isBleedingFlow(signals.flow);
}

export function hasProlongedBleeding(signals: SafetyCheckSignals, thresholdDays: number): boolean {
  if (!isBleedingFlow(signals.flow)) return false;
  return signals.priorConsecutiveBleedingDays + 1 >= thresholdDays;
}

function readThresholdDays(params: SafetyRuleContent["params"]): number {
  const value = params.thresholdDays;
  return typeof value === "number" && value > 0 ? value : DEFAULT_PROLONGED_BLEEDING_THRESHOLD_DAYS;
}

const DETECTORS: Record<SafetyRuleKey, (signals: SafetyCheckSignals, params: SafetyRuleContent["params"]) => boolean> = {
  heavy_bleeding: (signals) => isHeavyBleeding(signals),
  severe_or_worsening_pain: (signals) => isSevereOrWorseningPain(signals),
  fainting: (signals) => hasFainting(signals),
  dizziness_with_heavy_bleeding: (signals) => hasDizzinessWithHeavyBleeding(signals),
  unusual_bleeding_pattern: (signals) => hasUnusualBleedingPattern(signals),
  prolonged_bleeding: (signals, params) => hasProlongedBleeding(signals, readThresholdDays(params)),
};

/**
 * The single entry point: today's (plus a little recent history's) reported
 * signals, checked against whichever safety rules are currently active, each
 * one composed into a ready-to-show alert. Pure and deterministic — no I/O.
 * A day can trigger more than one rule; urgent alerts sort first.
 */
export function evaluateSafetySignals(
  signals: SafetyCheckSignals,
  rules: SafetyRuleContent[],
): SafetyAlert[] {
  const alerts: SafetyAlert[] = [];

  for (const rule of rules) {
    if (!rule.active) continue;
    const detector = DETECTORS[rule.ruleKey];
    if (!detector(signals, rule.params)) continue;
    alerts.push({
      ruleKey: rule.ruleKey,
      severity: rule.severity,
      label: rule.label,
      message: `${rule.message} ${SEVERITY_CALL_TO_ACTION[rule.severity]}`,
    });
  }

  return alerts.sort((a, b) => {
    if (a.severity === b.severity) return 0;
    return a.severity === "urgent" ? -1 : 1;
  });
}
