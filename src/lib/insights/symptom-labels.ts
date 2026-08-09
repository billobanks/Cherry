/**
 * Small, stable vocabulary mirroring the symptom_catalog seed rows
 * (supabase/migrations/20260808000000_onboarding.sql). Duplicated locally
 * rather than imported from the onboarding feature so this module has no
 * cross-feature dependency — same reasoning as cycle-engine's constants.
 */
export const SYMPTOM_LABELS: Record<string, string> = {
  cramps: "cramps",
  bloating: "bloating",
  fatigue: "fatigue",
  headache: "headaches",
  breast_tenderness: "breast tenderness",
  mood_swings: "mood swings",
  acne: "acne",
  backache: "backaches",
  food_cravings: "food cravings",
  insomnia: "trouble sleeping",
  nausea: "nausea",
  hot_flashes: "hot flashes",
};

export function labelForSymptomKey(key: string): string {
  return SYMPTOM_LABELS[key] ?? key.replace(/_/g, " ");
}
