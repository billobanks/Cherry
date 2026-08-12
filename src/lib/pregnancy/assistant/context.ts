import type { PregnancyDatingResult } from "../dating-engine";
import type { PregnancyAssistantTodaySignals, PregnancyAssistantUserContext } from "./types";

export interface RecentPregnancySymptomCount {
  symptomKey: string;
  count: number;
}

export interface BuildPregnancyAssistantContextInput {
  dating: PregnancyDatingResult;
  /** Null when nothing's been logged today. */
  today: PregnancyAssistantTodaySignals | null;
  recentSymptomCounts: RecentPregnancySymptomCount[];
  /** How many days back `recentSymptomCounts` was computed over. */
  recentWindowDays: number;
  /** symptom key -> display label. */
  symptomLabels: Record<string, string>;
}

/**
 * Pure assembly of everything the pregnancy assistant may personalize with,
 * from already-fetched data. No I/O, no calls to the AI provider.
 */
export function buildPregnancyAssistantContext(input: BuildPregnancyAssistantContextInput): PregnancyAssistantUserContext {
  const { dating, today, recentSymptomCounts, recentWindowDays, symptomLabels } = input;

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
    gestationalAgeWeeks: dating.gestationalAgeWeeks,
    gestationalAgeDays: dating.gestationalAgeDays,
    trimester: dating.currentTrimester,
    estimatedDueDate: dating.estimatedDueDate,
    hasLoggedToday: today !== null,
    today,
    recentSymptomFrequency,
  };
}
