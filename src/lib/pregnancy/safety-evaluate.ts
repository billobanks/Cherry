import { FETAL_MOVEMENT_RELEVANT_FROM_WEEK, PREGNANCY_SEVERITY_CALL_TO_ACTION, PRETERM_LABOR_THRESHOLD_WEEK } from "./safety-catalog";
import type {
  PregnancySafetyAlert,
  PregnancySafetyCheckSignals,
  PregnancySafetyRuleContent,
  PregnancySafetyRuleKey,
} from "./safety-types";

function severityOf(signals: PregnancySafetyCheckSignals, key: string) {
  return signals.symptomSeverities[key as keyof typeof signals.symptomSeverities];
}

function isLogged(signals: PregnancySafetyCheckSignals, key: string): boolean {
  return severityOf(signals, key) != null;
}

export function isHeavyBleeding(signals: PregnancySafetyCheckSignals): boolean {
  return severityOf(signals, "spotting_bleeding") === "severe";
}

export function isSevereAbdominalPain(signals: PregnancySafetyCheckSignals): boolean {
  return severityOf(signals, "cramping") === "severe" || severityOf(signals, "pelvic_discomfort") === "severe";
}

export function hasSevereHeadacheWithVisionChanges(signals: PregnancySafetyCheckSignals): boolean {
  return severityOf(signals, "headache") === "severe" && isLogged(signals, "vision_changes");
}

export function hasReducedFetalMovement(signals: PregnancySafetyCheckSignals): boolean {
  return signals.gestationalAgeWeeks >= FETAL_MOVEMENT_RELEVANT_FROM_WEEK && isLogged(signals, "fetal_movement");
}

export function hasSignsOfPretermLabor(signals: PregnancySafetyCheckSignals): boolean {
  if (signals.gestationalAgeWeeks >= PRETERM_LABOR_THRESHOLD_WEEK) return false;
  return isLogged(signals, "contractions") || isLogged(signals, "fluid_leaking") || severityOf(signals, "pelvic_discomfort") === "severe";
}

export function hasSevereSwellingWithHeadache(signals: PregnancySafetyCheckSignals): boolean {
  return severityOf(signals, "swelling") === "severe" && isLogged(signals, "headache");
}

export function hasFever(signals: PregnancySafetyCheckSignals): boolean {
  return isLogged(signals, "fever");
}

export function hasSevereVomiting(signals: PregnancySafetyCheckSignals): boolean {
  return severityOf(signals, "vomiting") === "severe";
}

export function hasFluidLeaking(signals: PregnancySafetyCheckSignals): boolean {
  return isLogged(signals, "fluid_leaking");
}

const DETECTORS: Record<PregnancySafetyRuleKey, (signals: PregnancySafetyCheckSignals) => boolean> = {
  heavy_bleeding: isHeavyBleeding,
  severe_abdominal_pain: isSevereAbdominalPain,
  severe_headache_with_vision_changes: hasSevereHeadacheWithVisionChanges,
  reduced_fetal_movement: hasReducedFetalMovement,
  signs_of_preterm_labor: hasSignsOfPretermLabor,
  severe_swelling_with_headache: hasSevereSwellingWithHeadache,
  fever: hasFever,
  severe_vomiting_unable_to_keep_fluids: hasSevereVomiting,
  fluid_leaking: hasFluidLeaking,
};

/**
 * Today's logged symptoms (plus gestational age, for the week-dependent
 * rules) checked against whichever pregnancy safety rules are currently
 * active. Pure and deterministic — the app never uses generative AI to
 * decide emergency risk classification, only this rule engine.
 */
export function evaluatePregnancySafety(
  signals: PregnancySafetyCheckSignals,
  rules: PregnancySafetyRuleContent[],
): PregnancySafetyAlert[] {
  const alerts: PregnancySafetyAlert[] = [];

  for (const rule of rules) {
    if (!rule.active) continue;
    const detector = DETECTORS[rule.ruleKey];
    if (!detector(signals)) continue;
    alerts.push({
      ruleKey: rule.ruleKey,
      severity: rule.severity,
      label: rule.label,
      message: `${rule.message} ${PREGNANCY_SEVERITY_CALL_TO_ACTION[rule.severity]}`,
    });
  }

  return alerts.sort((a, b) => {
    if (a.severity === b.severity) return 0;
    return a.severity === "urgent" ? -1 : 1;
  });
}
