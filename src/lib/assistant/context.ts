import { PHASE_LABELS, type CycleInsights } from "@/lib/cycle-engine";
import type { AssistantTodaySignals, AssistantUserContext } from "./types";

export interface RecentSymptomCount {
  symptomKey: string;
  count: number;
}

export interface BuildAssistantContextInput {
  /** Null when the user hasn't logged a period start date yet. */
  cycleInsights: CycleInsights | null;
  /** Null when nothing's been logged today. */
  today: AssistantTodaySignals | null;
  recentSymptomCounts: RecentSymptomCount[];
  /** How many days back `recentSymptomCounts` was computed over. */
  recentWindowDays: number;
  /** symptom_catalog key -> display label. */
  symptomLabels: Record<string, string>;
}

/**
 * Pure assembly of everything the assistant may personalize with, from
 * already-fetched data. No I/O, no calls to the AI provider — just shaping.
 */
export function buildAssistantContext(input: BuildAssistantContextInput): AssistantUserContext {
  const { cycleInsights, today, recentSymptomCounts, recentWindowDays, symptomLabels } = input;

  const recentSymptomFrequency = recentSymptomCounts
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((s) => ({
      key: s.symptomKey,
      label: symptomLabels[s.symptomKey] ?? s.symptomKey,
      daysLogged: s.count,
      ofRecentDays: recentWindowDays,
    }));

  return {
    hasCycleData: cycleInsights !== null,
    phase: cycleInsights?.currentPhase ?? null,
    phaseLabel: cycleInsights ? PHASE_LABELS[cycleInsights.currentPhase] : null,
    cycleDay: cycleInsights?.currentCycleDay ?? null,
    averageCycleLengthDays: cycleInsights?.effectiveCycleLengthDays ?? null,
    hasLoggedToday: today !== null,
    today,
    recentSymptomFrequency,
  };
}
