export type SelfReportedVariability =
  | "regular"
  | "somewhat_irregular"
  | "irregular"
  | "not_sure";

export type ConfidenceLevel = "high" | "moderate" | "low";

export type CyclePhase =
  | "menstrual"
  | "follicular"
  | "ovulation_window"
  | "luteal";

/** ISO yyyy-mm-dd date string. */
export type ISODateString = string;

export interface CycleCalculationInput {
  /** The most recently logged period start date. Required. */
  mostRecentPeriodStartDate: ISODateString;
  /**
   * Earlier known period start dates. Order doesn't matter and it's fine to
   * include (or omit) `mostRecentPeriodStartDate` itself — the engine sorts
   * and dedupes. Anything on or after `mostRecentPeriodStartDate` is ignored.
   */
  historicalPeriodStartDates?: ISODateString[];
  /** Manually entered average cycle length, used when history is insufficient. */
  averageCycleLengthDays?: number | null;
  /** Manually entered average period duration, used when history is insufficient. */
  averagePeriodDurationDays?: number | null;
  /** Self-reported regularity, used when history is insufficient to derive it statistically. */
  cycleVariability?: SelfReportedVariability | null;
  /** Injectable "today", for deterministic calculation and testing. Defaults to the real current date (UTC). */
  today?: ISODateString;
}

export type CycleLengthSource = "historical" | "manual" | "default";
export type VariabilitySource = "historical" | "self_reported" | "default";

export interface DataSourceSummary {
  cycleLength: CycleLengthSource;
  variability: VariabilitySource;
  /** Number of completed cycles (consecutive start-date pairs) found in history. */
  historicalCyclesUsed: number;
}

export interface PhaseRange {
  phase: CyclePhase;
  /** 1-indexed day-of-cycle, inclusive. */
  startDayOfCycle: number;
  endDayOfCycle: number;
  startDate: ISODateString;
  endDate: ISODateString;
}

export interface NextPeriodEstimate {
  date: ISODateString;
  /** date - variability buffer */
  earliestDate: ISODateString;
  /** date + variability buffer */
  latestDate: ISODateString;
  /** Always >= 1: the estimate is always projected to a date after "today". */
  daysUntil: number;
  confidence: ConfidenceLevel;
}

export interface OvulationWindowEstimate {
  startDate: ISODateString;
  endDate: ISODateString;
  confidence: ConfidenceLevel;
}

export interface CycleDisclaimers {
  /** General "this is an estimate, not medical advice" framing. */
  general: string;
  /** Specifically hedges the ovulation window language. */
  ovulation: string;
  /** Explicit "do not use this as contraception" statement. */
  notContraception: string;
}

export interface CycleInsights {
  today: ISODateString;
  mostRecentPeriodStartDate: ISODateString;
  /** 1-indexed; can exceed effectiveCycleLengthDays when a period is late. */
  currentCycleDay: number;
  effectiveCycleLengthDays: number;
  effectivePeriodLengthDays: number;
  dataSource: DataSourceSummary;
  currentPhase: CyclePhase;
  /** All four phases of the current cycle, in order, with concrete date ranges. */
  phases: PhaseRange[];
  estimatedNextPeriod: NextPeriodEstimate;
  estimatedOvulationWindow: OvulationWindowEstimate;
  isPeriodLate: boolean;
  daysLate: number;
  disclaimers: CycleDisclaimers;
}
