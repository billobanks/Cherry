import {
  MIN_CYCLES_FOR_HISTORICAL_PRIORITY,
  ROBUST_HISTORY_CYCLE_COUNT,
} from "./constants";
import type { ConfidenceLevel, SelfReportedVariability } from "./types";

export type DataQualityTier = "none" | "minimal" | "moderate" | "robust";

export function classifyDataQuality(cyclesUsed: number): DataQualityTier {
  if (cyclesUsed <= 0) return "none";
  if (cyclesUsed < MIN_CYCLES_FOR_HISTORICAL_PRIORITY) return "minimal";
  if (cyclesUsed < ROBUST_HISTORY_CYCLE_COUNT) return "moderate";
  return "robust";
}

const BASE_CONFIDENCE_BY_DATA_QUALITY: Record<DataQualityTier, ConfidenceLevel> = {
  none: "low",
  minimal: "low",
  moderate: "moderate",
  robust: "high",
};

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = {
  low: 0,
  moderate: 1,
  high: 2,
};
const RANK_TO_CONFIDENCE: ConfidenceLevel[] = ["low", "moderate", "high"];

/** How many confidence ranks a given variability reading knocks off the base score. */
const VARIABILITY_PENALTY: Record<SelfReportedVariability, number> = {
  regular: 0,
  somewhat_irregular: 1,
  irregular: 2,
  not_sure: 1,
};

function downgrade(level: ConfidenceLevel, byRanks: number): ConfidenceLevel {
  const rank = Math.max(0, CONFIDENCE_RANK[level] - byRanks);
  return RANK_TO_CONFIDENCE[rank];
}

/**
 * Combines how much history is available with how consistent it (or the
 * self-report standing in for it) is. Irregular cycles or thin data both
 * pull confidence down; neither alone can push it above what the other allows.
 */
export function computePeriodConfidence(
  dataQuality: DataQualityTier,
  variability: SelfReportedVariability,
): ConfidenceLevel {
  const base = BASE_CONFIDENCE_BY_DATA_QUALITY[dataQuality];
  return downgrade(base, VARIABILITY_PENALTY[variability]);
}

/**
 * Ovulation timing can't be observed from cycle-start dates alone — it's
 * always a step less certain than the period-date prediction it's derived
 * from, however good the underlying data is. This is what keeps ovulation
 * confidence from ever being reported as "high" on flimsier evidence than
 * the period estimate it rides on.
 */
export function computeOvulationConfidence(
  periodConfidence: ConfidenceLevel,
): ConfidenceLevel {
  return downgrade(periodConfidence, 1);
}
