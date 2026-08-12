import type { PregnancySymptomKey } from "@/types/database";

export const PREGNANCY_SYMPTOM_OPTIONS: { key: PregnancySymptomKey; label: string }[] = [
  { key: "nausea", label: "Nausea" },
  { key: "vomiting", label: "Vomiting" },
  { key: "headache", label: "Headache" },
  { key: "heartburn", label: "Heartburn" },
  { key: "constipation", label: "Constipation" },
  { key: "bloating", label: "Bloating" },
  { key: "back_discomfort", label: "Back discomfort" },
  { key: "pelvic_discomfort", label: "Pelvic discomfort" },
  { key: "cramping", label: "Cramping" },
  { key: "breast_tenderness", label: "Breast tenderness" },
  { key: "swelling", label: "Swelling" },
  { key: "shortness_of_breath", label: "Shortness of breath" },
  { key: "vaginal_discharge", label: "Vaginal discharge" },
  { key: "spotting_bleeding", label: "Spotting / bleeding" },
  { key: "fetal_movement", label: "Reduced fetal movement" },
  { key: "contractions", label: "Contractions" },
  { key: "fever", label: "Fever" },
  { key: "vision_changes", label: "Vision changes" },
  { key: "fluid_leaking", label: "Fluid leaking" },
  { key: "other", label: "Other" },
];

export const PREGNANCY_ENERGY_SCALE_LABELS = ["Very low", "Low", "Okay", "Good", "Great"];
export const PREGNANCY_SLEEP_SCALE_LABELS = ["Very poor", "Poor", "Okay", "Good", "Great"];
export const PREGNANCY_HYDRATION_SCALE_LABELS = ["Very low", "Low", "Okay", "Good", "Great"];
export const PREGNANCY_APPETITE_SCALE_LABELS = ["Very low", "Low", "Okay", "Good", "Great"];

export const PREGNANCY_NOTES_MAX_LENGTH = 2000;
