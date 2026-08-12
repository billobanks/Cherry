import type { PregnancySafetyRuleKey, PregnancySafetySeverity } from "./safety-types";

export const PREGNANCY_SAFETY_RULE_KEYS: PregnancySafetyRuleKey[] = [
  "heavy_bleeding",
  "severe_abdominal_pain",
  "severe_headache_with_vision_changes",
  "reduced_fetal_movement",
  "signs_of_preterm_labor",
  "severe_swelling_with_headache",
  "fever",
  "severe_vomiting_unable_to_keep_fluids",
  "fluid_leaking",
];

/**
 * Fixed in code, not stored, for the same reason as the menstrual safety
 * engine: a medically reviewed rule's urgency can't be softened by a text
 * edit, only by deliberately changing `severity`.
 */
export const PREGNANCY_SEVERITY_CALL_TO_ACTION: Record<PregnancySafetySeverity, string> = {
  routine: "It's a good idea to mention this at your next prenatal visit.",
  urgent: "Because of that, it's a good idea to contact your prenatal care provider or seek medical care promptly rather than waiting.",
};

/** Movement counting becomes a standard part of prenatal guidance from the third trimester on. */
export const FETAL_MOVEMENT_RELEVANT_FROM_WEEK = 28;

/** Contractions/fluid leaking/etc. before this week are evaluated as possible preterm labor signs. */
export const PRETERM_LABOR_THRESHOLD_WEEK = 37;
