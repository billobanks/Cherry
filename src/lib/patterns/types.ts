import type { CyclePhase } from "@/lib/cycle-engine";

export interface HistoricalCycle {
  startDate: string; // ISO yyyy-mm-dd
  cycleLengthDays: number;
  periodLengthDays: number;
}

export interface SymptomLogEntry {
  date: string; // ISO yyyy-mm-dd
  symptomKey: string;
}

export interface SymptomPattern {
  symptomKey: string;
  /** How many of the eligible past cycles had this symptom logged during the phase in question. */
  occurrences: number;
  /** How many past, completed cycles actually had this phase (almost always all of them). */
  eligibleCycles: number;
}

/** A symptom or mood tagged to a date — the two share this shape so one engine handles both. */
export interface TaggedLogEntry {
  date: string;
  key: string;
}

/** A recurring symptom/mood found in a specific phase, across however many phases had enough data. */
export interface CategoricalPhasePattern {
  key: string;
  phase: CyclePhase;
  occurrences: number;
  eligibleCycles: number;
}

export interface CycleLengthDataPoint {
  startDate: string;
  lengthDays: number;
}

export interface CycleLengthTrend {
  averageDays: number;
  dataPoints: CycleLengthDataPoint[];
  cycleCount: number;
}

export interface PeriodDurationDataPoint {
  startDate: string;
  durationDays: number;
}

export interface PeriodDurationTrend {
  averageDays: number;
  dataPoints: PeriodDurationDataPoint[];
  cycleCount: number;
}

export interface SymptomFrequency {
  key: string;
  count: number;
}

/** One logged value (energy, sleep quality, ...) on a given date. */
export interface DailyMetricEntry {
  date: string;
  value: number;
}

export interface CycleDayAverage {
  cycleDay: number;
  average: number;
  sampleSize: number;
}

export interface WindowPattern {
  /** e.g. "2-3 days before your period" or "days 8-13" */
  windowLabel: string;
  direction: "higher" | "lower";
  metricLabel: string;
  windowAverage: number;
  overallAverage: number;
  cycleCount: number;
  sentence: string;
}

export interface CycleMetricAnalysis {
  /** Per-cycle-day average, for charting — pooled across all cycles with data on that day. */
  profile: CycleDayAverage[];
  patterns: WindowPattern[];
}
