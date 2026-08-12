import type { CyclePhase } from "@/lib/cycle-engine";
import type { AssistantMessageRole, CheckinFlow, Mood } from "@/types/database";

export type AssistantRole = AssistantMessageRole;

export interface AssistantMessage {
  role: AssistantRole;
  content: string;
}

/** What the user logged today, if anything. */
export interface AssistantTodaySignals {
  flow: CheckinFlow | null;
  energyLevel: number | null;
  sleepQuality: number | null;
  painSeverity: number | null;
  mood: Mood[];
  symptomKeys: string[];
}

export interface SymptomFrequency {
  key: string;
  label: string;
  daysLogged: number;
  ofRecentDays: number;
}

/**
 * Everything the assistant is allowed to personalize with. Built once per
 * request from real cycle/check-in data — the prompt builder and the UI both
 * read from this rather than touching raw tables themselves.
 */
export interface AssistantUserContext {
  hasCycleData: boolean;
  phase: CyclePhase | null;
  phaseLabel: string | null;
  cycleDay: number | null;
  averageCycleLengthDays: number | null;
  hasLoggedToday: boolean;
  today: AssistantTodaySignals | null;
  /** Symptoms logged at least once in the recent window, most frequent first. */
  recentSymptomFrequency: SymptomFrequency[];
}
