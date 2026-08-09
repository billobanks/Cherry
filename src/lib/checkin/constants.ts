import type {
  CheckinFlow,
  DischargeType,
  ExerciseIntensity,
  Mood,
} from "@/types/database";

export const FLOW_OPTIONS: { value: CheckinFlow; label: string }[] = [
  { value: "none", label: "None" },
  { value: "spotting", label: "Spotting" },
  { value: "light", label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "heavy", label: "Heavy" },
];

export const MOOD_OPTIONS: { value: Mood; label: string; emoji: string }[] = [
  { value: "happy", label: "Happy", emoji: "🙂" },
  { value: "calm", label: "Calm", emoji: "😌" },
  { value: "anxious", label: "Anxious", emoji: "😰" },
  { value: "irritable", label: "Irritable", emoji: "😤" },
  { value: "sad", label: "Sad", emoji: "😔" },
  { value: "emotional", label: "Emotional", emoji: "🥺" },
  { value: "stressed", label: "Stressed", emoji: "😖" },
];

export const EXERCISE_OPTIONS: { value: ExerciseIntensity; label: string }[] = [
  { value: "none", label: "None" },
  { value: "light", label: "Light" },
  { value: "moderate", label: "Moderate" },
  { value: "intense", label: "Intense" },
];

export const DISCHARGE_OPTIONS: { value: DischargeType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "spotting", label: "Spotting" },
  { value: "sticky", label: "Sticky" },
  { value: "creamy", label: "Creamy" },
  { value: "watery", label: "Watery" },
  { value: "egg_white", label: "Egg-white" },
  { value: "unusual", label: "Unusual" },
];

/** The check-in's fixed 12-symptom list. Keys line up with symptom_catalog. */
export const CHECKIN_SYMPTOM_OPTIONS: { key: string; label: string }[] = [
  { key: "cramps", label: "Cramps" },
  { key: "bloating", label: "Bloating" },
  { key: "headache", label: "Headache" },
  { key: "breast_tenderness", label: "Breast tenderness" },
  { key: "acne", label: "Acne" },
  { key: "backache", label: "Back pain" },
  { key: "nausea", label: "Nausea" },
  { key: "diarrhea", label: "Diarrhea" },
  { key: "constipation", label: "Constipation" },
  { key: "fatigue", label: "Fatigue" },
  { key: "food_cravings", label: "Cravings" },
  { key: "pelvic_discomfort", label: "Pelvic discomfort" },
];

export const ENERGY_SCALE_LABELS = ["Very low", "Low", "Okay", "Good", "Great"];
export const SLEEP_SCALE_LABELS = ["Very poor", "Poor", "Okay", "Good", "Great"];
export const LIBIDO_SCALE_LABELS = ["Very low", "Low", "Okay", "High", "Very high"];

export const NOTES_MAX_LENGTH = 2000;

/** How many past days' worth of check-ins the "recent entries" list shows. */
export const RECENT_CHECKINS_LIMIT = 14;
