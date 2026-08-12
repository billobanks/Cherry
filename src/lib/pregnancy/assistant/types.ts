import type { AssistantMessageRole, Mood, PregnancySymptomKey, PregnancySymptomSeverity, Trimester } from "@/types/database";

export type PregnancyAssistantRole = AssistantMessageRole;

export interface PregnancyAssistantMessage {
  role: PregnancyAssistantRole;
  content: string;
}

/** What the user logged today, if anything. */
export interface PregnancyAssistantTodaySignals {
  mood: Mood[];
  energyLevel: number | null;
  sleepQuality: number | null;
  symptomSeverities: Partial<Record<PregnancySymptomKey, PregnancySymptomSeverity>>;
}

export interface PregnancyAssistantSymptomFrequency {
  key: string;
  label: string;
  daysLogged: number;
  ofRecentDays: number;
}

/**
 * Everything the pregnancy assistant is allowed to personalize with. Built
 * once per request from real dating/log data — the prompt builder and the
 * safety integration both read from this rather than touching raw tables.
 */
export interface PregnancyAssistantUserContext {
  gestationalAgeWeeks: number;
  gestationalAgeDays: number;
  trimester: Trimester;
  estimatedDueDate: string;
  hasLoggedToday: boolean;
  today: PregnancyAssistantTodaySignals | null;
  /** Symptoms logged at least once in the recent window, most frequent first. */
  recentSymptomFrequency: PregnancyAssistantSymptomFrequency[];
}
