import { todayEpochDays, type CyclePhase } from "@/lib/cycle-engine";
import { PHASE_SECTION_CONTENT, SECTION_TITLES, labelForSymptomKey, type InsightSectionKey } from "@/lib/insights";
import { generateMovementRecommendation } from "@/lib/movement";
import { PHASE_NUTRITION_CONTENT, filterMeals } from "@/lib/nutrition";
import type { Goal, Mood } from "@/types/database";
import type {
  HistoricalSymptomPattern,
  RecommendedArticle,
  SymptomAwarenessNote,
  TodayEngineInput,
  TodayEngineOutput,
  TodayEngineSignals,
} from "./types";

const LOW_SCALE_THRESHOLD = 2;
const HIGH_SCALE_THRESHOLD = 4;
const STRESSED_MOODS: Mood[] = ["stressed", "anxious", "sad", "irritable"];
const MAX_SYMPTOM_AWARENESS_NOTES = 4;

/** Which section a goal most directly maps to, for the recommended article — only consulted when today's own signals don't already point somewhere more specific. */
const GOAL_TO_SECTION: Partial<Record<Goal, InsightSectionKey>> = {
  improve_energy: "energy",
  improve_sleep: "sleep",
  understand_mood: "mood",
  understand_pms: "symptoms_to_monitor",
  nutrition_guidance: "nutrition",
  exercise_guidance: "exercise",
  track_symptoms: "symptoms_to_monitor",
};

const PHASE_HEADLINES: Record<CyclePhase, string> = {
  menstrual: "Today might be a good day to take things a little slower.",
  follicular: "Your energy may start building from here — a good stretch to look ahead in.",
  ovulation_window: "You may have a bit more energy around this point in your cycle.",
  luteal: "Your body may be gearing up for your next period, so a slower pace today wouldn't be unusual.",
};

function safeModulo(value: number, length: number): number {
  return ((value % length) + length) % length;
}

function hasSymptom(today: TodayEngineSignals | null, key: string): boolean {
  return today?.symptomKeys.includes(key) ?? false;
}

/**
 * Physical, concretely-logged signals (a symptom, a low scale rating) win
 * over a subjective mood read, which wins over the phase default — same
 * layering philosophy as `movement/recommend.ts`'s `determineTier`.
 */
function buildHeadline(phase: CyclePhase, today: TodayEngineSignals | null): string {
  if (today) {
    const lowEnergy = today.energyLevel != null && today.energyLevel <= LOW_SCALE_THRESHOLD;
    const poorSleep = today.sleepQuality != null && today.sleepQuality <= LOW_SCALE_THRESHOLD;
    const physicallyTaxing = hasSymptom(today, "cramps") || hasSymptom(today, "fatigue");
    if (lowEnergy || poorSleep || physicallyTaxing) {
      return "Your body may be asking for a slower pace today.";
    }
    if (today.energyLevel != null && today.energyLevel >= HIGH_SCALE_THRESHOLD) {
      return "You might have a bit more energy to work with today.";
    }
    if (today.mood.some((m) => STRESSED_MOODS.includes(m))) {
      return "Today might be a good day to be a little extra gentle with yourself.";
    }
  }
  return PHASE_HEADLINES[phase];
}

function buildBodyInsight(phase: CyclePhase, today: TodayEngineSignals | null): string {
  const phaseContent = PHASE_SECTION_CONTENT[phase];
  if (!today) return phaseContent.body_overview.summary;
  if (today.energyLevel != null && today.energyLevel <= LOW_SCALE_THRESHOLD) {
    return phaseContent.energy.points[0] ?? phaseContent.energy.summary;
  }
  if (today.sleepQuality != null && today.sleepQuality <= LOW_SCALE_THRESHOLD) {
    return phaseContent.sleep.points[0] ?? phaseContent.sleep.summary;
  }
  return phaseContent.body_overview.summary;
}

function buildNutritionSuggestion(
  phase: CyclePhase,
  dietaryPreference: TodayEngineInput["dietaryPreference"],
  avoidTerms: string[],
  dayNumber: number,
): TodayEngineOutput["nutrition"] {
  const copy = PHASE_NUTRITION_CONTENT[phase];
  const allowed = filterMeals(copy.meals, dietaryPreference, avoidTerms);
  const candidates = allowed.length > 0 ? allowed : copy.meals;
  return {
    meal: candidates[safeModulo(dayNumber, candidates.length)],
    hydrationTip: copy.hydration.tip,
  };
}

function buildSelfCareSuggestion(phase: CyclePhase, today: TodayEngineSignals | null, dayNumber: number): string {
  const points = PHASE_SECTION_CONTENT[phase].self_care.points;
  if (today?.mood.some((m) => STRESSED_MOODS.includes(m))) return points[0];
  return points[safeModulo(dayNumber, points.length)];
}

function buildSleepSuggestion(phase: CyclePhase, today: TodayEngineSignals | null, dayNumber: number): string {
  const points = PHASE_SECTION_CONTENT[phase].sleep.points;
  if (today?.sleepQuality != null && today.sleepQuality <= LOW_SCALE_THRESHOLD) return points[0];
  return points[safeModulo(dayNumber, points.length)];
}

/**
 * Never a diagnosis: today's logged symptoms are phrased as "commonly
 * reported," and historical recurrence is phrased as "you've logged," never
 * "this means" or a named cause.
 */
function buildSymptomAwareness(
  phase: CyclePhase,
  today: TodayEngineSignals | null,
  historicalPatterns: HistoricalSymptomPattern[],
): SymptomAwarenessNote[] {
  const notes: SymptomAwarenessNote[] = [];
  const relatedKeys = new Set(PHASE_SECTION_CONTENT[phase].symptoms_to_monitor.relatedSymptomKeys ?? []);

  for (const key of today?.symptomKeys ?? []) {
    if (relatedKeys.has(key)) {
      const label = labelForSymptomKey(key);
      notes.push({ key, label, note: `${label.charAt(0).toUpperCase()}${label.slice(1)} is something a lot of people notice during this phase.` });
    }
  }

  for (const pattern of historicalPatterns) {
    notes.push({
      key: pattern.symptomKey,
      label: pattern.label,
      note: `You've noticed ${pattern.label} coming up during this phase in ${pattern.occurrences} of your last ${pattern.eligibleCycles} cycles.`,
    });
  }

  return notes.slice(0, MAX_SYMPTOM_AWARENESS_NOTES);
}

function pickRecommendedArticle(phase: CyclePhase, today: TodayEngineSignals | null, goals: Goal[]): RecommendedArticle {
  const phaseContent = PHASE_SECTION_CONTENT[phase];
  const relatedKeys = phaseContent.symptoms_to_monitor.relatedSymptomKeys ?? [];

  let sectionKey: InsightSectionKey | null = null;
  if (today) {
    if (today.symptomKeys.some((k) => relatedKeys.includes(k))) sectionKey = "symptoms_to_monitor";
    else if (today.energyLevel != null && today.energyLevel <= LOW_SCALE_THRESHOLD) sectionKey = "energy";
    else if (today.sleepQuality != null && today.sleepQuality <= LOW_SCALE_THRESHOLD) sectionKey = "sleep";
  }

  if (!sectionKey) {
    for (const goal of goals) {
      const mapped = GOAL_TO_SECTION[goal];
      if (mapped) {
        sectionKey = mapped;
        break;
      }
    }
  }

  sectionKey ??= "self_care";

  return { sectionKey, title: SECTION_TITLES[sectionKey], teaser: phaseContent[sectionKey].summary };
}

/**
 * The single entry point: cycle position, today's real signals, this
 * user's own historical patterns, goals, and preferences — composed into
 * one deterministic recommendation. No generative AI: gestational-style
 * "safety" isn't relevant here, but the same discipline applies — headline,
 * phase, cycle day, and every suggestion are pure lookups/calculations, not
 * model output. AI (if ever layered on top) may only reword this, never
 * decide it.
 */
export function buildTodayEngineOutput(input: TodayEngineInput): TodayEngineOutput {
  const { cycleDay, phase, today, historicalPatterns, dietaryPreference, foodAllergies, foodsToAvoid, preferredMovementTypes, goals } =
    input;
  const dayNumber = input.dayNumber ?? todayEpochDays();
  const avoidTerms = [...foodAllergies, ...foodsToAvoid];

  const movement = generateMovementRecommendation({
    phase,
    energyLevel: today?.energyLevel ?? null,
    hasCramps: hasSymptom(today, "cramps"),
    hasFatigue: hasSymptom(today, "fatigue"),
    sleepQuality: today?.sleepQuality ?? null,
    preferredTypes: preferredMovementTypes,
    dayNumber,
  });

  return {
    cycleDay,
    phase,
    headline: buildHeadline(phase, today),
    bodyInsight: buildBodyInsight(phase, today),
    nutrition: buildNutritionSuggestion(phase, dietaryPreference, avoidTerms, dayNumber),
    movement,
    selfCare: { suggestion: buildSelfCareSuggestion(phase, today, dayNumber) },
    sleep: { suggestion: buildSleepSuggestion(phase, today, dayNumber) },
    symptomAwareness: buildSymptomAwareness(phase, today, historicalPatterns),
    recommendedArticle: pickRecommendedArticle(phase, today, goals),
  };
}
