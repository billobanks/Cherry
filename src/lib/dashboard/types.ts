import type { ConfidenceLevel, CyclePhase, ISODateString, PhaseRange } from "@/lib/cycle-engine";
import type { UpcomingChange } from "./upcoming-changes";
import type { Mood } from "@/types/database";

export interface TodaysBody {
  hasLoggedToday: boolean;
  mood: Mood[];
  energyLevel: number | null;
  sleepQuality: number | null;
  hasCravings: boolean;
}

export interface RecommendedCard {
  key: "nutrition" | "exercise" | "self_care" | "sleep";
  title: string;
  teaser: string;
}

export interface PatternDisplay {
  symptomKey: string;
  label: string;
  occurrences: number;
  eligibleCycles: number;
}

export interface DashboardData {
  displayName: string | null;
  today: ISODateString;
  currentCycleDay: number;
  cycleLengthDays: number;
  phase: CyclePhase;
  phaseLabel: string;
  phases: PhaseRange[];
  nextPeriod: {
    date: ISODateString;
    daysUntil: number;
    confidence: ConfidenceLevel;
  };
  todaysInsight: {
    headline: string;
    explanation: string;
  };
  todaysBody: TodaysBody;
  upcomingChanges: UpcomingChange[];
  recommended: RecommendedCard[];
  patterns: PatternDisplay[];
}
