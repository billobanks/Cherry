import type { Mood, PregnancySymptomKey, PregnancySymptomSeverity, PregnancyWeekSection, Trimester } from "@/types/database";
import { PREGNANCY_SYMPTOM_OPTIONS } from "./constants";
import type { PregnancyDatingResult } from "./dating-engine";
import type { PregnancySafetyAlert } from "./safety-types";
import { SYMPTOM_EDUCATION } from "./symptom-education";
import { TRIMESTER_GUIDANCE } from "./trimester-content";

const FULL_TERM_DAYS = 280;

export interface PregnancyTodaySignals {
  mood: Mood[];
  energyLevel: number | null;
  sleepQuality: number | null;
  hydrationLevel: number | null;
  appetiteLevel: number | null;
  symptoms: Partial<Record<PregnancySymptomKey, PregnancySymptomSeverity>>;
}

export interface PregnancyTodayInput {
  dating: PregnancyDatingResult;
  today: PregnancyTodaySignals | null;
  /** Only ever PUBLISHED content — see week-content-actions.ts. */
  publishedWeekContent: Partial<Record<PregnancyWeekSection, string>>;
  safetyAlerts: PregnancySafetyAlert[];
}

export type PregnancySafetyStatus = "clear" | "routine" | "urgent";

export interface RecommendedArticle {
  title: string;
  blurb: string;
}

export interface PregnancyTodayOutput {
  gestationalAgeWeeks: number;
  gestationalAgeDays: number;
  trimester: Trimester;
  estimatedDueDate: string;
  daysUntilEstimatedDueDate: number;
  /** 0-100, rounded. */
  percentComplete: number;
  babyDevelopment: string;
  bodyChanges: string;
  todayInsight: string;
  nutritionSuggestion: string;
  movementSuggestion: string;
  hydrationSuggestion: string;
  sleepSuggestion: string;
  emotionalWellnessSuggestion: string;
  symptomEducation: { key: PregnancySymptomKey; label: string; blurb: string }[];
  safetyStatus: PregnancySafetyStatus;
  recommendedArticles: RecommendedArticle[];
  questionsForProvider: string[];
  comingUp: string;
}

export const GENERIC_COMING_UP =
  "As your pregnancy progresses, you'll notice new changes and have new things worth discussing with your provider — check back each week for what's relevant then.";

function deriveSafetyStatus(alerts: PregnancySafetyAlert[]): PregnancySafetyStatus {
  if (alerts.some((a) => a.severity === "urgent")) return "urgent";
  if (alerts.length > 0) return "routine";
  return "clear";
}

function buildTodayInsight(trimester: Trimester, today: PregnancyTodaySignals | null): string {
  if (!today) return "Log today's check-in to get insight tailored to how you're feeling.";
  if (today.energyLevel != null && today.energyLevel <= 2) {
    return "Lower energy today is common — rest when you can, and keep up with fluids and small meals.";
  }
  return TRIMESTER_GUIDANCE[trimester].todayInsight;
}

const SYMPTOM_LABELS: Record<PregnancySymptomKey, string> = Object.fromEntries(
  PREGNANCY_SYMPTOM_OPTIONS.map((o) => [o.key, o.label]),
) as Record<PregnancySymptomKey, string>;

/**
 * The single composer: dating + today's signals + whatever medically
 * reviewed week content has actually been published + safety alerts,
 * combined into one deterministic dashboard payload. No generative AI
 * involved in gestational age, due date, safety status, or any guarantee
 * about development — those are all pure lookups/calculations.
 */
export function buildPregnancyToday(input: PregnancyTodayInput): PregnancyTodayOutput {
  const { dating, today, publishedWeekContent, safetyAlerts } = input;
  const guidance = TRIMESTER_GUIDANCE[dating.currentTrimester];

  const symptomEducation = Object.keys(today?.symptoms ?? {}).map((key) => {
    const symptomKey = key as PregnancySymptomKey;
    return { key: symptomKey, label: SYMPTOM_LABELS[symptomKey], blurb: SYMPTOM_EDUCATION[symptomKey] };
  });

  const recommendedArticles: RecommendedArticle[] = (
    [
      ["baby_development", "This week's baby development"],
      ["body_changes", "This week's body changes"],
      ["self_care", "Self-care ideas for this week"],
    ] as [PregnancyWeekSection, string][]
  )
    .filter(([section]) => publishedWeekContent[section])
    .map(([section, title]) => ({ title, blurb: publishedWeekContent[section]!.slice(0, 160) }));

  if (recommendedArticles.length === 0) {
    recommendedArticles.push(
      { title: "What to expect this trimester", blurb: guidance.bodyChanges },
      { title: "Nutrition this trimester", blurb: guidance.nutrition },
      { title: "Emotional wellbeing", blurb: guidance.emotionalWellness },
    );
  }

  const questionsForProvider = publishedWeekContent.questions_for_provider
    ? publishedWeekContent.questions_for_provider.split("\n").filter(Boolean)
    : guidance.questionsForProvider;

  return {
    gestationalAgeWeeks: dating.gestationalAgeWeeks,
    gestationalAgeDays: dating.gestationalAgeDays,
    trimester: dating.currentTrimester,
    estimatedDueDate: dating.estimatedDueDate,
    daysUntilEstimatedDueDate: dating.daysUntilEstimatedDueDate,
    percentComplete: Math.max(0, Math.min(100, Math.round((dating.totalGestationalAgeDays / FULL_TERM_DAYS) * 100))),
    babyDevelopment: publishedWeekContent.baby_development ?? guidance.babyDevelopment,
    bodyChanges: publishedWeekContent.body_changes ?? guidance.bodyChanges,
    todayInsight: buildTodayInsight(dating.currentTrimester, today),
    nutritionSuggestion: publishedWeekContent.nutrition ?? guidance.nutrition,
    movementSuggestion: publishedWeekContent.movement ?? guidance.movement,
    hydrationSuggestion: guidance.hydration,
    sleepSuggestion: guidance.sleep,
    emotionalWellnessSuggestion: guidance.emotionalWellness,
    symptomEducation,
    safetyStatus: deriveSafetyStatus(safetyAlerts),
    recommendedArticles,
    questionsForProvider,
    comingUp: publishedWeekContent.coming_up ?? GENERIC_COMING_UP,
  };
}
