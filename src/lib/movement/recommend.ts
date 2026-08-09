import { todayEpochDays, type CyclePhase } from "@/lib/cycle-engine";
import {
  DURATION_BY_TIER,
  MOVEMENT_CATALOG,
  OPTIONS_BY_TIER,
  RANK_TO_TIER,
  TIER_RANK,
} from "./catalog";
import type {
  IntensityTier,
  MovementOption,
  MovementRecommendation,
  MovementType,
  OverrideReason,
  TodaysSignals,
} from "./types";

function phaseDefaultTier(phase: CyclePhase): IntensityTier {
  switch (phase) {
    case "menstrual":
      return "gentle";
    case "follicular":
      return "moderate";
    case "ovulation_window":
      return "vigorous";
    case "luteal":
      return "moderate";
  }
}

function bumpTierUp(tier: IntensityTier): IntensityTier {
  return RANK_TO_TIER[Math.min(TIER_RANK[tier] + 1, RANK_TO_TIER.length - 1)];
}

function bumpTierDown(tier: IntensityTier): IntensityTier {
  return RANK_TO_TIER[Math.max(TIER_RANK[tier] - 1, 0)];
}

/**
 * The phase suggests a baseline; today's actual logged signals adjust it.
 * Symptom-based signals (cramps, fatigue, poor sleep) are applied last and
 * always win, on the theory that a physical signal logged today is a more
 * concrete basis for "go gentler" than a subjective energy rating or a
 * general phase tendency — safety over inference, in that order.
 */
export function determineTier(signals: TodaysSignals): {
  tier: IntensityTier;
  reason: OverrideReason;
  overrideApplied: boolean;
} {
  const baseline = phaseDefaultTier(signals.phase);
  let tier = baseline;
  let reason: OverrideReason = "phase_only";
  // Tracks whether a signal actually changed something — not just whether the
  // *final* tier differs from baseline, since a later signal (e.g. fatigue)
  // can cancel out an earlier one (e.g. high energy) and land back on the
  // baseline tier while still being the real, reportable reason why.
  let signalFired = false;

  if (signals.energyLevel != null && signals.energyLevel <= 2) {
    tier = "gentle";
    reason = "low_energy";
    signalFired = true;
  } else if (signals.energyLevel != null && signals.energyLevel >= 4) {
    const bumped = bumpTierUp(baseline);
    if (bumped !== baseline) {
      tier = bumped;
      reason = "high_energy";
      signalFired = true;
    }
  }

  if (signals.sleepQuality != null && signals.sleepQuality <= 2) {
    tier = "gentle";
    reason = "poor_sleep";
    signalFired = true;
  }
  if (signals.hasFatigue) {
    tier = "gentle";
    reason = "fatigue";
    signalFired = true;
  }
  if (signals.hasCramps) {
    tier = "gentle";
    reason = "cramps";
    signalFired = true;
  }

  return { tier, reason: signalFired ? reason : "phase_only", overrideApplied: signalFired };
}

function safeModulo(value: number, length: number): number {
  return ((value % length) + length) % length;
}

function pickFromTier(
  tier: IntensityTier,
  preferredTypes: MovementType[],
  dayNumber: number,
): MovementOption {
  const tierOptions = OPTIONS_BY_TIER[tier];
  const preferred = tierOptions.filter((o) => preferredTypes.includes(o.key));
  const candidates = preferred.length > 0 ? preferred : tierOptions;
  return candidates[safeModulo(dayNumber, candidates.length)];
}

function pickAlternative(
  tier: IntensityTier,
  primary: MovementOption,
  preferredTypes: MovementType[],
  dayNumber: number,
): MovementOption {
  const remaining = OPTIONS_BY_TIER[tier].filter((o) => o.key !== primary.key);
  if (remaining.length === 0) return primary;
  const preferred = remaining.filter((o) => preferredTypes.includes(o.key));
  const candidates = preferred.length > 0 ? preferred : remaining;
  return candidates[safeModulo(dayNumber + 1, candidates.length)];
}

const PHASE_WHY: Record<CyclePhase, string> = {
  menstrual:
    "Many people lean toward gentler movement during their period, though this varies a lot from person to person — some feel completely fine with their usual routine.",
  follicular:
    "Energy often starts building as your period ends, which is a common reason to lean toward moderate movement here — but everyone's pattern is different.",
  ovulation_window:
    "Some people notice more energy around their estimated ovulation window, which is why higher-intensity movement is suggested — though not everyone feels this shift, and that's completely normal too.",
  luteal:
    "In the lead-up to your next period, moderate movement is a common middle ground for a lot of people — but energy in this phase varies widely from person to person.",
};

const OVERRIDE_WHY: Record<Exclude<OverrideReason, "phase_only">, string> = {
  cramps: "You logged cramps today, so this leans gentler than your cycle phase alone would suggest.",
  fatigue: "You logged fatigue today, so this leans gentler than your cycle phase alone would suggest.",
  poor_sleep: "You logged lower sleep quality today, so this leans gentler than your cycle phase alone would suggest.",
  low_energy: "You logged lower energy today, so this leans gentler than your cycle phase alone would suggest.",
  high_energy: "You logged higher energy today, so this leans a bit more energetic than your cycle phase alone would suggest.",
};

function buildWhy(phase: CyclePhase, reason: OverrideReason): string {
  return reason === "phase_only" ? PHASE_WHY[phase] : OVERRIDE_WHY[reason];
}

/**
 * The single entry point: today's cycle phase plus whatever's actually been
 * logged today, composed into one recommendation. Pure and deterministic
 * given a `dayNumber` — no I/O, no reliance on the real clock unless the
 * caller omits `dayNumber`.
 */
export function generateMovementRecommendation(signals: TodaysSignals): MovementRecommendation {
  const dayNumber = signals.dayNumber ?? todayEpochDays();
  const { tier, reason, overrideApplied } = determineTier(signals);
  const primary = pickFromTier(tier, signals.preferredTypes, dayNumber);
  const alternative = pickAlternative(tier, primary, signals.preferredTypes, dayNumber);

  return {
    primary,
    alternative,
    tier,
    overrideReason: reason,
    overrideApplied,
    why: buildWhy(signals.phase, reason),
    duration: DURATION_BY_TIER[tier],
  };
}

/** One step gentler than the given tier — the "Not feeling it today?" fallback. Rest is always the floor. */
export function getGentlerOption(currentTier: IntensityTier, dayNumber: number): MovementOption {
  if (currentTier === "gentle") return MOVEMENT_CATALOG.recovery_rest;
  const gentlerTier = bumpTierDown(currentTier);
  const candidates = OPTIONS_BY_TIER[gentlerTier];
  return candidates[safeModulo(dayNumber, candidates.length)];
}
