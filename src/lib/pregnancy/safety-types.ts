import type { PregnancySafetySeverity, PregnancySymptomKey, PregnancySymptomSeverity } from "@/types/database";

export type { PregnancySafetySeverity };

export type PregnancySafetyRuleKey =
  | "heavy_bleeding"
  | "severe_abdominal_pain"
  | "severe_headache_with_vision_changes"
  | "reduced_fetal_movement"
  | "signs_of_preterm_labor"
  | "severe_swelling_with_headache"
  | "fever"
  | "severe_vomiting_unable_to_keep_fluids"
  | "fluid_leaking";

/** What today's check-in reports, as far as the safety engine is concerned. */
export interface PregnancySafetyCheckSignals {
  gestationalAgeWeeks: number;
  /** Only the symptoms actually logged today — absence of a key means "not logged," not "none." */
  symptomSeverities: Partial<Record<PregnancySymptomKey, PregnancySymptomSeverity>>;
}

/** A pregnancy safety rule's admin-managed content, as read from `pregnancy_safety_rules`. */
export interface PregnancySafetyRuleContent {
  ruleKey: PregnancySafetyRuleKey;
  label: string;
  severity: PregnancySafetySeverity;
  message: string;
  active: boolean;
  params: Record<string, number | string | boolean>;
}

export interface PregnancySafetyAlert {
  ruleKey: PregnancySafetyRuleKey;
  severity: PregnancySafetySeverity;
  label: string;
  message: string;
}
