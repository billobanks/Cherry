import type { IntensityTier, MovementOption, MovementType } from "./types";

export const MOVEMENT_CATALOG: Record<MovementType, MovementOption> = {
  recovery_rest: { key: "recovery_rest", label: "Recovery / rest", tier: "gentle" },
  stretching: { key: "stretching", label: "Stretching", tier: "gentle" },
  yoga: { key: "yoga", label: "Yoga", tier: "gentle" },
  walking: { key: "walking", label: "Walking", tier: "gentle" },
  pilates: { key: "pilates", label: "Pilates", tier: "moderate" },
  strength_training: { key: "strength_training", label: "Strength training", tier: "moderate" },
  cycling: { key: "cycling", label: "Cycling", tier: "vigorous" },
  running: { key: "running", label: "Running", tier: "vigorous" },
  hiit: { key: "hiit", label: "HIIT", tier: "vigorous" },
};

export const MOVEMENT_ORDER: MovementType[] = [
  "walking",
  "yoga",
  "stretching",
  "strength_training",
  "pilates",
  "cycling",
  "running",
  "hiit",
  "recovery_rest",
];

export const OPTIONS_BY_TIER: Record<IntensityTier, MovementOption[]> = {
  gentle: ["recovery_rest", "stretching", "yoga", "walking"].map((k) => MOVEMENT_CATALOG[k as MovementType]),
  moderate: ["pilates", "strength_training"].map((k) => MOVEMENT_CATALOG[k as MovementType]),
  vigorous: ["cycling", "running", "hiit"].map((k) => MOVEMENT_CATALOG[k as MovementType]),
};

export const DURATION_BY_TIER: Record<IntensityTier, string> = {
  gentle: "15-25 minutes",
  moderate: "25-40 minutes",
  vigorous: "30-45 minutes",
};

export const TIER_RANK: Record<IntensityTier, number> = { gentle: 0, moderate: 1, vigorous: 2 };
export const RANK_TO_TIER: IntensityTier[] = ["gentle", "moderate", "vigorous"];
