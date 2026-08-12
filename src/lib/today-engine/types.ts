import type { CyclePhase } from "@/lib/cycle-engine";
import type { InsightSectionKey } from "@/lib/insights";
import type { DietaryPreference, MealIdea } from "@/lib/nutrition";
import type { MovementRecommendation, MovementType } from "@/lib/movement";
import type { Goal, Mood } from "@/types/database";

/** What's actually been logged today — null when there's no check-in yet. */
export interface TodayEngineSignals {
  energyLevel: number | null;
  sleepQuality: number | null;
  mood: Mood[];
  symptomKeys: string[];
}

/** A recurring symptom found across the user's own cycle history — "you've noticed X coming up during this phase in N of M cycles." */
export interface HistoricalSymptomPattern {
  symptomKey: string;
  label: string;
  occurrences: number;
  eligibleCycles: number;
}

export interface TodayEngineInput {
  cycleDay: number;
  phase: CyclePhase;
  /** Null when nothing has been logged today — the engine degrades to phase-only guidance. */
  today: TodayEngineSignals | null;
  historicalPatterns: HistoricalSymptomPattern[];
  goals: Goal[];
  dietaryPreference: DietaryPreference;
  foodAllergies: string[];
  foodsToAvoid: string[];
  preferredMovementTypes: MovementType[];
  /** Injectable for deterministic day-to-day rotation of suggestions; defaults to a real epoch-day count. */
  dayNumber?: number;
}

export interface NutritionSuggestion {
  meal: MealIdea;
  hydrationTip: string;
}

export interface SymptomAwarenessNote {
  key: string;
  label: string;
  note: string;
}

export interface RecommendedArticle {
  sectionKey: InsightSectionKey;
  title: string;
  teaser: string;
}

export interface TodayEngineOutput {
  cycleDay: number;
  phase: CyclePhase;
  headline: string;
  bodyInsight: string;
  nutrition: NutritionSuggestion;
  movement: MovementRecommendation;
  selfCare: { suggestion: string };
  sleep: { suggestion: string };
  symptomAwareness: SymptomAwarenessNote[];
  recommendedArticle: RecommendedArticle;
}
