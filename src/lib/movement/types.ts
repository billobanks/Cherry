import type { CyclePhase } from "@/lib/cycle-engine";
import type { MovementType } from "@/types/database";

export type { MovementType };

export type IntensityTier = "gentle" | "moderate" | "vigorous";

export interface MovementOption {
  key: MovementType;
  label: string;
  tier: IntensityTier;
}

/**
 * What we actually know about today. Everything is optional/nullable
 * because a check-in might not exist yet — the engine's whole job is to
 * degrade gracefully from "nothing logged" (phase-only) to "fully informed"
 * (today's real signals override the phase default).
 */
export interface TodaysSignals {
  phase: CyclePhase;
  energyLevel: number | null;
  hasCramps: boolean;
  hasFatigue: boolean;
  sleepQuality: number | null;
  preferredTypes: MovementType[];
  /** Injectable for deterministic day-to-day rotation; defaults to a real epoch-day count. */
  dayNumber?: number;
}

export type OverrideReason =
  | "cramps"
  | "fatigue"
  | "poor_sleep"
  | "low_energy"
  | "high_energy"
  | "phase_only";

export interface MovementRecommendation {
  primary: MovementOption;
  alternative: MovementOption;
  tier: IntensityTier;
  overrideReason: OverrideReason;
  /** True when today's actual logged signals changed the outcome from the plain phase default. */
  overrideApplied: boolean;
  why: string;
  duration: string;
}
