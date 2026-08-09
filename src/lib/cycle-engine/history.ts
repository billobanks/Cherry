import {
  REGULAR_STDDEV_THRESHOLD_DAYS,
  SOMEWHAT_IRREGULAR_STDDEV_THRESHOLD_DAYS,
} from "./constants";
import { parseISODate } from "./date-utils";
import type { ISODateString } from "./types";

/**
 * Sorts and dedupes historical start dates against the most recent one,
 * dropping anything on or after it (it isn't "history" — it's the anchor).
 * Returns epoch-day numbers, ascending, oldest first, most recent last.
 */
export function buildCycleStartSequence(
  mostRecentPeriodStartDate: ISODateString,
  historicalPeriodStartDates: ISODateString[],
): number[] {
  const mostRecent = parseISODate(mostRecentPeriodStartDate);
  const priorDays = Array.from(
    new Set(historicalPeriodStartDates.map(parseISODate)),
  ).filter((day) => day < mostRecent);
  priorDays.sort((a, b) => a - b);
  return [...priorDays, mostRecent];
}

/** Consecutive differences between start dates — each one is a completed cycle's length. */
export function deriveCycleLengthsFromSequence(sequence: number[]): number[] {
  const lengths: number[] = [];
  for (let i = 1; i < sequence.length; i++) {
    lengths.push(sequence[i] - sequence[i - 1]);
  }
  return lengths;
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Sample standard deviation (n-1 denominator). 0 when fewer than 2 values. */
export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance =
    values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export type DerivedVariability = "regular" | "somewhat_irregular" | "irregular";

export function classifyVariabilityFromStdDev(
  stdDevDays: number,
): DerivedVariability {
  if (stdDevDays <= REGULAR_STDDEV_THRESHOLD_DAYS) return "regular";
  if (stdDevDays <= SOMEWHAT_IRREGULAR_STDDEV_THRESHOLD_DAYS) return "somewhat_irregular";
  return "irregular";
}

export interface HistoricalCycleStats {
  /** Number of completed cycles (consecutive start-date pairs) available. */
  cyclesUsed: number;
  cycleLengths: number[];
  averageCycleLengthDays: number | null;
  stdDevDays: number;
  variability: DerivedVariability | null;
}

/** Pure statistics derived from history — doesn't decide whether they're "trusted" yet, see engine.ts. */
export function computeHistoricalCycleStats(
  mostRecentPeriodStartDate: ISODateString,
  historicalPeriodStartDates: ISODateString[],
): HistoricalCycleStats {
  const sequence = buildCycleStartSequence(
    mostRecentPeriodStartDate,
    historicalPeriodStartDates,
  );
  const cycleLengths = deriveCycleLengthsFromSequence(sequence);

  if (cycleLengths.length === 0) {
    return {
      cyclesUsed: 0,
      cycleLengths: [],
      averageCycleLengthDays: null,
      stdDevDays: 0,
      variability: null,
    };
  }

  const stdDevDays = standardDeviation(cycleLengths);

  return {
    cyclesUsed: cycleLengths.length,
    cycleLengths,
    averageCycleLengthDays: mean(cycleLengths),
    stdDevDays,
    variability: classifyVariabilityFromStdDev(stdDevDays),
  };
}
