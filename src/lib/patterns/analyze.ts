import {
  addDays,
  computePhaseDayBoundaries,
  formatISODate,
  mean,
  parseISODate,
  type CyclePhase,
  type PhaseDayBoundaries,
} from "@/lib/cycle-engine";
import type {
  CategoricalPhasePattern,
  CycleDayAverage,
  CycleLengthTrend,
  CycleMetricAnalysis,
  DailyMetricEntry,
  HistoricalCycle,
  PeriodDurationTrend,
  SymptomFrequency,
  SymptomLogEntry,
  SymptomPattern,
  TaggedLogEntry,
  WindowPattern,
} from "./types";

const MIN_ELIGIBLE_CYCLES = 2;
const MIN_OCCURRENCES = 2;

const ALL_PHASES: CyclePhase[] = ["menstrual", "follicular", "ovulation_window", "luteal"];

/** ~6 calendar months, approximated in days — cycle-engine deliberately avoids calendar-month arithmetic. */
const DEFAULT_LOOKBACK_DAYS = 183;
const MIN_CYCLES_FOR_LENGTH_TREND = 2;
const MIN_CYCLES_FOR_DURATION_TREND = 2;
const MIN_OCCURRENCES_FOR_COMMON_SYMPTOM = 2;
const MIN_CYCLES_FOR_WINDOW_PATTERN = 3;
/** Minimum gap (on a 1-5 scale) between a window's average and the rest of the cycle to call it a pattern. */
const WINDOW_DIFFERENCE_THRESHOLD = 0.4;
/** How many days out a period-day search window can extend into a cycle before giving up. */
const PERIOD_SEARCH_CAP_DAYS = 14;

function phaseDayRange(boundaries: PhaseDayBoundaries, phase: CyclePhase): [number, number] | null {
  switch (phase) {
    case "menstrual":
      return boundaries.menstrual;
    case "follicular":
      return boundaries.follicular;
    case "ovulation_window":
      return boundaries.ovulationWindow;
    case "luteal":
      return boundaries.luteal;
  }
}

/**
 * Finds symptoms that recur during a given phase across past cycles — the
 * "you've noticed headaches coming up during this phase in 3 of your last 4
 * cycles" signal. Pure: `completedCycles` must already be *past, finished* cycles
 * (real cycleLengthDays, not the current in-progress one), which is the
 * caller's responsibility to filter for.
 */
export function analyzeSymptomPatterns(params: {
  currentPhase: CyclePhase;
  completedCycles: HistoricalCycle[];
  symptomLogs: SymptomLogEntry[];
}): SymptomPattern[] {
  const { currentPhase, completedCycles, symptomLogs } = params;

  const logDaysByKey = new Map<string, number[]>();
  for (const log of symptomLogs) {
    const day = parseISODate(log.date);
    const days = logDaysByKey.get(log.symptomKey);
    if (days) {
      days.push(day);
    } else {
      logDaysByKey.set(log.symptomKey, [day]);
    }
  }

  let eligibleCycles = 0;
  const occurrenceCounts = new Map<string, number>();

  for (const cycle of completedCycles) {
    const boundaries = computePhaseDayBoundaries(cycle.cycleLengthDays, cycle.periodLengthDays);
    const range = phaseDayRange(boundaries, currentPhase);
    if (!range) continue; // this cycle's shape didn't produce this phase (extreme edge case)
    eligibleCycles++;

    const cycleStart = parseISODate(cycle.startDate);
    const rangeStart = addDays(cycleStart, range[0] - 1);
    const rangeEnd = addDays(cycleStart, range[1] - 1);

    for (const [symptomKey, days] of logDaysByKey) {
      const loggedDuringThisPhase = days.some((d) => d >= rangeStart && d <= rangeEnd);
      if (loggedDuringThisPhase) {
        occurrenceCounts.set(symptomKey, (occurrenceCounts.get(symptomKey) ?? 0) + 1);
      }
    }
  }

  if (eligibleCycles < MIN_ELIGIBLE_CYCLES) return [];

  const patterns: SymptomPattern[] = [];
  for (const [symptomKey, occurrences] of occurrenceCounts) {
    if (occurrences >= MIN_OCCURRENCES) {
      patterns.push({ symptomKey, occurrences, eligibleCycles });
    }
  }

  patterns.sort((a, b) => {
    const ratioDiff = b.occurrences / b.eligibleCycles - a.occurrences / a.eligibleCycles;
    return ratioDiff !== 0 ? ratioDiff : b.occurrences - a.occurrences;
  });

  return patterns;
}

/**
 * Same recurrence signal as {@link analyzeSymptomPatterns}, but across all
 * four phases at once rather than one — used by the full My Patterns page,
 * which surfaces the strongest pattern regardless of which phase it's in,
 * not just today's. Works for symptoms or moods; both are just
 * (date, key) pairs.
 */
export function analyzeTaggedPatternsAllPhases(
  completedCycles: HistoricalCycle[],
  logs: TaggedLogEntry[],
): CategoricalPhasePattern[] {
  const logDaysByKey = new Map<string, number[]>();
  for (const log of logs) {
    const day = parseISODate(log.date);
    const days = logDaysByKey.get(log.key);
    if (days) {
      days.push(day);
    } else {
      logDaysByKey.set(log.key, [day]);
    }
  }

  const results: CategoricalPhasePattern[] = [];

  for (const phase of ALL_PHASES) {
    let eligibleCycles = 0;
    const occurrenceCounts = new Map<string, number>();

    for (const cycle of completedCycles) {
      const boundaries = computePhaseDayBoundaries(cycle.cycleLengthDays, cycle.periodLengthDays);
      const range = phaseDayRange(boundaries, phase);
      if (!range) continue;
      eligibleCycles++;

      const cycleStart = parseISODate(cycle.startDate);
      const rangeStart = addDays(cycleStart, range[0] - 1);
      const rangeEnd = addDays(cycleStart, range[1] - 1);

      for (const [key, days] of logDaysByKey) {
        if (days.some((d) => d >= rangeStart && d <= rangeEnd)) {
          occurrenceCounts.set(key, (occurrenceCounts.get(key) ?? 0) + 1);
        }
      }
    }

    if (eligibleCycles < MIN_ELIGIBLE_CYCLES) continue;
    for (const [key, occurrences] of occurrenceCounts) {
      if (occurrences >= MIN_OCCURRENCES) {
        results.push({ key, phase, occurrences, eligibleCycles });
      }
    }
  }

  results.sort((a, b) => {
    const ratioDiff = b.occurrences / b.eligibleCycles - a.occurrences / a.eligibleCycles;
    return ratioDiff !== 0 ? ratioDiff : b.occurrences - a.occurrences;
  });

  return results;
}

/** Average cycle length over the last several months — "your average cycle ... is 29 days." */
export function analyzeCycleLengthTrend(
  completedCycles: HistoricalCycle[],
  today: string,
  lookbackDays: number = DEFAULT_LOOKBACK_DAYS,
): CycleLengthTrend | null {
  const cutoff = parseISODate(today) - lookbackDays;
  const dataPoints = completedCycles
    .filter((c) => parseISODate(c.startDate) >= cutoff)
    .map((c) => ({ startDate: c.startDate, lengthDays: c.cycleLengthDays }));

  if (dataPoints.length < MIN_CYCLES_FOR_LENGTH_TREND) return null;

  return {
    averageDays: Math.round(mean(dataPoints.map((d) => d.lengthDays)) * 10) / 10,
    dataPoints,
    cycleCount: dataPoints.length,
  };
}

/**
 * Average *logged* period duration — counts actual period_day_logs entries
 * near each cycle's start, not the stored estimate, so it reflects what
 * really got logged rather than an assumption carried over from onboarding.
 */
export function analyzePeriodDurationTrend(
  completedCycles: HistoricalCycle[],
  periodLogDates: string[],
  today: string,
  lookbackDays: number = DEFAULT_LOOKBACK_DAYS,
): PeriodDurationTrend | null {
  const cutoff = parseISODate(today) - lookbackDays;
  const logDays = new Set(periodLogDates.map(parseISODate));

  const dataPoints = [];
  for (const cycle of completedCycles) {
    const startDay = parseISODate(cycle.startDate);
    if (startDay < cutoff) continue;
    const searchWindow = Math.min(cycle.cycleLengthDays, PERIOD_SEARCH_CAP_DAYS);
    let count = 0;
    for (let d = 0; d < searchWindow; d++) {
      if (logDays.has(startDay + d)) count++;
    }
    if (count > 0) dataPoints.push({ startDate: cycle.startDate, durationDays: count });
  }

  if (dataPoints.length < MIN_CYCLES_FOR_DURATION_TREND) return null;

  return {
    averageDays: Math.round(mean(dataPoints.map((d) => d.durationDays)) * 10) / 10,
    dataPoints,
    cycleCount: dataPoints.length,
  };
}

/** Ranked symptom frequency across the given logs — "most common symptoms." */
export function analyzeMostCommonSymptoms(
  symptomLogs: SymptomLogEntry[],
  minOccurrences: number = MIN_OCCURRENCES_FOR_COMMON_SYMPTOM,
): SymptomFrequency[] {
  const counts = new Map<string, number>();
  for (const log of symptomLogs) {
    counts.set(log.symptomKey, (counts.get(log.symptomKey) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .filter(([, count]) => count >= minOccurrences)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

/** Pools a metric's logged values by absolute cycle-day-number across cycles — the basis for day-of-cycle charts. */
export function buildCycleDayProfile(
  completedCycles: HistoricalCycle[],
  entries: DailyMetricEntry[],
): CycleDayAverage[] {
  const entryByDate = new Map(entries.map((e) => [e.date, e.value]));
  const byCycleDay = new Map<number, number[]>();

  for (const cycle of completedCycles) {
    const startDay = parseISODate(cycle.startDate);
    for (let d = 0; d < cycle.cycleLengthDays; d++) {
      const value = entryByDate.get(formatISODate(startDay + d));
      if (value === undefined) continue;
      const cycleDay = d + 1;
      const values = byCycleDay.get(cycleDay);
      if (values) values.push(value);
      else byCycleDay.set(cycleDay, [value]);
    }
  }

  return Array.from(byCycleDay.entries())
    .map(([cycleDay, values]) => ({ cycleDay, average: mean(values), sampleSize: values.length }))
    .sort((a, b) => a.cycleDay - b.cycleDay);
}

/**
 * Compares a window of days against the rest of the cycle, per cycle, then
 * averages those per-cycle comparisons — so a cycle with more logged days
 * doesn't dominate the result. `isInWindow` receives the 1-indexed day
 * number and that cycle's own length, so "N days before period" windows
 * (which land on a different absolute day per cycle) and fixed absolute-day
 * windows can share one implementation.
 */
function analyzeCycleWindow(
  completedCycles: HistoricalCycle[],
  entries: DailyMetricEntry[],
  isInWindow: (dayNumber: number, cycleLengthDays: number) => boolean,
  minCycles: number = MIN_CYCLES_FOR_WINDOW_PATTERN,
): { windowAverage: number; overallAverage: number; cycleCount: number } | null {
  const entryByDate = new Map(entries.map((e) => [e.date, e.value]));
  const perCycleWindowAverages: number[] = [];
  const perCycleRestAverages: number[] = [];

  for (const cycle of completedCycles) {
    const startDay = parseISODate(cycle.startDate);
    const windowValues: number[] = [];
    const restValues: number[] = [];

    for (let d = 0; d < cycle.cycleLengthDays; d++) {
      const value = entryByDate.get(formatISODate(startDay + d));
      if (value === undefined) continue;
      if (isInWindow(d + 1, cycle.cycleLengthDays)) windowValues.push(value);
      else restValues.push(value);
    }

    if (windowValues.length > 0 && restValues.length > 0) {
      perCycleWindowAverages.push(mean(windowValues));
      perCycleRestAverages.push(mean(restValues));
    }
  }

  if (perCycleWindowAverages.length < minCycles) return null;

  return {
    windowAverage: mean(perCycleWindowAverages),
    overallAverage: mean(perCycleRestAverages),
    cycleCount: perCycleWindowAverages.length,
  };
}

function beforePeriodWindow(range: [number, number]) {
  return (dayNumber: number, cycleLengthDays: number) => {
    const daysBefore = cycleLengthDays - dayNumber + 1;
    return daysBefore >= range[0] && daysBefore <= range[1];
  };
}

function absoluteDayWindow(range: [number, number]) {
  return (dayNumber: number) => dayNumber >= range[0] && dayNumber <= range[1];
}

/**
 * Checks two specific, physiologically-plausible windows rather than
 * free-form pattern mining: a late-cycle dip/rise in the few days before a
 * period, and a rise/dip around days 8-13 (roughly the follicular window).
 * Deliberately narrow — searching for *any* contiguous window that happens
 * to differ risks surfacing noise as a "pattern" from a handful of cycles;
 * checking known, expected windows and only reporting when data actually
 * supports them is the safer claim.
 */
function analyzeMetricWindows(
  completedCycles: HistoricalCycle[],
  entries: DailyMetricEntry[],
  metricLabel: string,
  phraseLower: (windowLabel: string) => string,
  phraseHigher: (windowLabel: string) => string,
): WindowPattern[] {
  const patterns: WindowPattern[] = [];

  const before = analyzeCycleWindow(completedCycles, entries, beforePeriodWindow([2, 3]));
  if (before) {
    const diff = before.windowAverage - before.overallAverage;
    if (Math.abs(diff) >= WINDOW_DIFFERENCE_THRESHOLD) {
      const direction = diff < 0 ? "lower" : "higher";
      patterns.push({
        windowLabel: "2-3 days before your period",
        direction,
        metricLabel,
        windowAverage: before.windowAverage,
        overallAverage: before.overallAverage,
        cycleCount: before.cycleCount,
        sentence:
          direction === "lower"
            ? phraseLower("2-3 days before your period")
            : phraseHigher("2-3 days before your period"),
      });
    }
  }

  const midCycle = analyzeCycleWindow(completedCycles, entries, absoluteDayWindow([8, 13]));
  if (midCycle) {
    const diff = midCycle.windowAverage - midCycle.overallAverage;
    if (Math.abs(diff) >= WINDOW_DIFFERENCE_THRESHOLD) {
      const direction = diff < 0 ? "lower" : "higher";
      patterns.push({
        windowLabel: "days 8-13",
        direction,
        metricLabel,
        windowAverage: midCycle.windowAverage,
        overallAverage: midCycle.overallAverage,
        cycleCount: midCycle.cycleCount,
        sentence: direction === "lower" ? phraseLower("days 8-13") : phraseHigher("days 8-13"),
      });
    }
  }

  return patterns;
}

export function analyzeEnergyPatterns(
  completedCycles: HistoricalCycle[],
  entries: DailyMetricEntry[],
): CycleMetricAnalysis {
  return {
    profile: buildCycleDayProfile(completedCycles, entries),
    patterns: analyzeMetricWindows(
      completedCycles,
      entries,
      "energy",
      (w: string) => `You've tended to feel a bit more tired ${w}.`,
      (w: string) => `Your energy has often felt a little brighter around ${w}.`,
    ),
  };
}

export function analyzeSleepPatterns(
  completedCycles: HistoricalCycle[],
  entries: DailyMetricEntry[],
): CycleMetricAnalysis {
  return {
    profile: buildCycleDayProfile(completedCycles, entries),
    patterns: analyzeMetricWindows(
      completedCycles,
      entries,
      "sleep quality",
      (w: string) => `Your sleep has tended to feel a little rougher ${w}.`,
      (w: string) => `Your sleep has often felt a bit better around ${w}.`,
    ),
  };
}
