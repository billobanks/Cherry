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
