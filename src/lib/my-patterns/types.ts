import type { CyclePhase } from "@/lib/cycle-engine";
import type { CycleLengthTrend, CycleMetricAnalysis, PeriodDurationTrend } from "@/lib/patterns";

export interface LabeledSymptomFrequency {
  key: string;
  label: string;
  count: number;
}

export interface PhasePatternSentence {
  key: string;
  label: string;
  phase: CyclePhase;
  phaseLabel: string;
  occurrences: number;
  eligibleCycles: number;
  sentence: string;
}

export interface MyPatternsData {
  cycleLength: CycleLengthTrend | null;
  periodDuration: PeriodDurationTrend | null;
  commonSymptoms: LabeledSymptomFrequency[];
  moodFrequency: LabeledSymptomFrequency[];
  moodPatterns: PhasePatternSentence[];
  energy: CycleMetricAnalysis;
  sleep: CycleMetricAnalysis;
  symptomPhasePatterns: PhasePatternSentence[];
  cravingPatterns: PhasePatternSentence[];
  /** True once there's enough history for at least one section to show something real. */
  hasAnyData: boolean;
}
