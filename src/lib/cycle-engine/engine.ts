import {
  classifyDataQuality,
  computeOvulationConfidence,
  computePeriodConfidence,
} from "./confidence";
import {
  DEFAULT_CYCLE_LENGTH_DAYS,
  DEFAULT_PERIOD_LENGTH_DAYS,
  MAX_CYCLE_LENGTH_DAYS,
  MAX_PERIOD_LENGTH_DAYS,
  MIN_CYCLE_LENGTH_DAYS,
  MIN_CYCLES_FOR_HISTORICAL_PRIORITY,
  MIN_PERIOD_LENGTH_DAYS,
  NEXT_PERIOD_RANGE_BY_VARIABILITY,
} from "./constants";
import { addDays, diffDays, formatISODate, parseISODate, todayEpochDays } from "./date-utils";
import { CYCLE_DISCLAIMERS } from "./disclaimers";
import { computeHistoricalCycleStats } from "./history";
import { buildPhaseRanges, classifyCurrentPhase, computePhaseDayBoundaries } from "./phases";
import type {
  CycleCalculationInput,
  CycleInsights,
  CycleLengthSource,
  SelfReportedVariability,
  VariabilitySource,
} from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export class CycleInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CycleInputError";
  }
}

/**
 * Computes a full picture of where someone is in their cycle and what's
 * likely next, from whatever combination of logged history and self-reported
 * averages is available. Pure and side-effect free (aside from defaulting
 * `today` to the real current date when not supplied) — safe to call from
 * a server action, an Edge Function, or directly in a React component.
 *
 * Historical period-start dates take priority over manually entered
 * averages whenever there are at least MIN_CYCLES_FOR_HISTORICAL_PRIORITY
 * completed cycles' worth of them; otherwise the manual average (or the
 * app default) is used. Every prediction here is an estimate — see
 * `disclaimers` on the result, and never surface these as diagnostic or as
 * contraception guidance.
 */
export function calculateCycleInsights(input: CycleCalculationInput): CycleInsights {
  const mostRecentStart = parseISODate(input.mostRecentPeriodStartDate);
  const today = input.today !== undefined ? parseISODate(input.today) : todayEpochDays();

  if (mostRecentStart > today) {
    throw new CycleInputError(
      "mostRecentPeriodStartDate is after `today` — a period can't start in the future.",
    );
  }

  const historyStats = computeHistoricalCycleStats(
    input.mostRecentPeriodStartDate,
    input.historicalPeriodStartDates ?? [],
  );
  const historyIsTrusted = historyStats.cyclesUsed >= MIN_CYCLES_FOR_HISTORICAL_PRIORITY;

  // --- Effective cycle length -------------------------------------------------
  let cycleLengthDays: number;
  let cycleLengthSource: CycleLengthSource;
  if (historyIsTrusted && historyStats.averageCycleLengthDays !== null) {
    cycleLengthDays = Math.round(historyStats.averageCycleLengthDays);
    cycleLengthSource = "historical";
  } else if (input.averageCycleLengthDays != null) {
    cycleLengthDays = Math.round(input.averageCycleLengthDays);
    cycleLengthSource = "manual";
  } else {
    cycleLengthDays = DEFAULT_CYCLE_LENGTH_DAYS;
    cycleLengthSource = "default";
  }
  cycleLengthDays = clamp(cycleLengthDays, MIN_CYCLE_LENGTH_DAYS, MAX_CYCLE_LENGTH_DAYS);

  // --- Effective period length (history only tells us cycle length, never this) ---
  let periodLengthDays: number;
  if (input.averagePeriodDurationDays != null) {
    periodLengthDays = Math.round(input.averagePeriodDurationDays);
  } else {
    periodLengthDays = DEFAULT_PERIOD_LENGTH_DAYS;
  }
  periodLengthDays = clamp(periodLengthDays, MIN_PERIOD_LENGTH_DAYS, MAX_PERIOD_LENGTH_DAYS);

  // --- Effective variability ---------------------------------------------------
  let variability: SelfReportedVariability;
  let variabilitySource: VariabilitySource;
  if (historyIsTrusted && historyStats.variability !== null) {
    variability = historyStats.variability;
    variabilitySource = "historical";
  } else if (input.cycleVariability != null) {
    variability = input.cycleVariability;
    variabilitySource = "self_reported";
  } else {
    variability = "not_sure";
    variabilitySource = "default";
  }

  // --- Where they are right now -------------------------------------------------
  const currentCycleDay = diffDays(today, mostRecentStart) + 1;
  const isPeriodLate = currentCycleDay > cycleLengthDays;
  const daysLate = isPeriodLate ? currentCycleDay - cycleLengthDays : 0;

  const boundaries = computePhaseDayBoundaries(cycleLengthDays, periodLengthDays);
  const currentPhase = classifyCurrentPhase(currentCycleDay, boundaries);
  const phases = buildPhaseRanges(mostRecentStart, boundaries);

  // --- Next period projection: always a date strictly after "today" -------------
  let nextPeriodEpoch = addDays(mostRecentStart, cycleLengthDays);
  while (nextPeriodEpoch <= today) {
    nextPeriodEpoch = addDays(nextPeriodEpoch, cycleLengthDays);
  }
  const daysUntil = diffDays(nextPeriodEpoch, today);

  const rangeDays =
    variabilitySource === "historical"
      ? clamp(Math.round(historyStats.stdDevDays), 1, 7)
      : NEXT_PERIOD_RANGE_BY_VARIABILITY[variability];

  // --- Confidence ----------------------------------------------------------------
  const dataQuality = classifyDataQuality(historyStats.cyclesUsed);
  const periodConfidence = computePeriodConfidence(dataQuality, variability);
  const ovulationConfidence = computeOvulationConfidence(periodConfidence);

  const ovulationWindow = phases.find((p) => p.phase === "ovulation_window");
  if (!ovulationWindow) {
    // Not reachable — computePhaseDayBoundaries always produces an ovulation window.
    throw new Error("Internal error: no ovulation window phase was computed.");
  }

  return {
    today: formatISODate(today),
    mostRecentPeriodStartDate: formatISODate(mostRecentStart),
    currentCycleDay,
    effectiveCycleLengthDays: cycleLengthDays,
    effectivePeriodLengthDays: periodLengthDays,
    dataSource: {
      cycleLength: cycleLengthSource,
      variability: variabilitySource,
      historicalCyclesUsed: historyStats.cyclesUsed,
    },
    currentPhase,
    phases,
    estimatedNextPeriod: {
      date: formatISODate(nextPeriodEpoch),
      earliestDate: formatISODate(addDays(nextPeriodEpoch, -rangeDays)),
      latestDate: formatISODate(addDays(nextPeriodEpoch, rangeDays)),
      daysUntil,
      confidence: periodConfidence,
    },
    estimatedOvulationWindow: {
      startDate: ovulationWindow.startDate,
      endDate: ovulationWindow.endDate,
      confidence: ovulationConfidence,
    },
    isPeriodLate,
    daysLate,
    disclaimers: CYCLE_DISCLAIMERS,
  };
}
