import type {
  CycleRegularity,
  Goal,
  NotificationCategory,
  PrimaryFocus,
} from "@/types/database";

export const FOCUS_OPTIONS: {
  value: PrimaryFocus;
  label: string;
  description: string;
}[] = [
  {
    value: "track_cycle",
    label: "Track my cycle",
    description: "Log periods and see what's coming next.",
  },
  {
    value: "understand_symptoms",
    label: "Understand symptoms & PMS",
    description: "Connect how I feel to where I am in my cycle.",
  },
  {
    value: "energy_sleep_mood",
    label: "Support energy, sleep & mood",
    description: "Notice patterns across the month.",
  },
  {
    value: "fertility_awareness",
    label: "Fertility awareness",
    description: "Understand fertility-related changes — not for contraception.",
  },
  {
    value: "exploring",
    label: "Just exploring",
    description: "Not sure yet — show me around.",
  },
];

export const REGULARITY_OPTIONS: {
  value: CycleRegularity;
  label: string;
  description: string;
}[] = [
  {
    value: "regular",
    label: "Pretty regular",
    description: "Usually within a few days of the same length.",
  },
  {
    value: "somewhat_irregular",
    label: "Somewhat irregular",
    description: "Varies by a week or so, cycle to cycle.",
  },
  {
    value: "irregular",
    label: "Irregular",
    description: "Varies a lot, or is hard to predict.",
  },
  {
    value: "not_sure",
    label: "Not sure yet",
    description: "Haven't tracked long enough to know.",
  },
];

export const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: "understand_cycle", label: "Understand my cycle" },
  { value: "predict_period", label: "Predict my next period" },
  { value: "understand_pms", label: "Understand PMS" },
  { value: "improve_energy", label: "Improve energy" },
  { value: "improve_sleep", label: "Improve sleep" },
  { value: "understand_mood", label: "Understand mood changes" },
  { value: "nutrition_guidance", label: "Nutrition guidance" },
  { value: "exercise_guidance", label: "Exercise guidance" },
  { value: "track_symptoms", label: "Track symptoms" },
  {
    value: "fertility_awareness",
    label: "Understand fertility-related cycle changes",
  },
];

export const NOTIFICATION_OPTIONS: {
  value: NotificationCategory;
  label: string;
  description: string;
}[] = [
  {
    value: "daily_checkin_reminder",
    label: "Daily check-in reminder",
    description: "A gentle nudge if you haven't logged today.",
  },
  {
    value: "period_prediction",
    label: "Period predictions",
    description: "Heads up a couple of days before your estimated start.",
  },
  {
    value: "insight_digest",
    label: "Weekly insight digest",
    description: "A short summary of patterns we noticed.",
  },
  {
    value: "product_updates",
    label: "Product updates",
    description: "Occasional news about new features.",
  },
];

/** Fallback shown while symptom_catalog loads; real options always come from Supabase. */
export const FALLBACK_SYMPTOMS = [
  { key: "cramps", label: "Cramps" },
  { key: "bloating", label: "Bloating" },
  { key: "fatigue", label: "Fatigue" },
  { key: "headache", label: "Headache" },
  { key: "breast_tenderness", label: "Breast tenderness" },
  { key: "mood_swings", label: "Mood swings" },
  { key: "acne", label: "Acne" },
  { key: "backache", label: "Backache" },
  { key: "food_cravings", label: "Food cravings" },
  { key: "insomnia", label: "Trouble sleeping" },
  { key: "nausea", label: "Nausea" },
  { key: "hot_flashes", label: "Hot flashes" },
];

export const CYCLE_LENGTH_RANGE = { min: 15, max: 60, default: 28 } as const;
export const PERIOD_LENGTH_RANGE = { min: 1, max: 14, default: 5 } as const;

export const ONBOARDING_DRAFT_STORAGE_KEY = "cherry.onboarding.draft.v1";
