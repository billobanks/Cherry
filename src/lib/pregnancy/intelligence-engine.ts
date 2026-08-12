import type {
  Mood,
  PregnancyFocusArea,
  PregnancySymptomKey,
  PregnancySymptomSeverity,
  PregnancyWeekSection,
} from "@/types/database";
import type { BodySystem } from "./body-system-content";
import { BODY_SYSTEM_CONTENT } from "./body-system-content";
import { PREGNANCY_SYMPTOM_OPTIONS } from "./constants";
import type { PregnancyDatingResult } from "./dating-engine";
import { TRIMESTER_NUTRITION } from "./nutrition-content";
import type { PatternSentence } from "./patterns-engine";
import type { PregnancySafetyAlert } from "./safety-types";
import { GENERIC_COMING_UP } from "./today-engine";
import { TRIMESTER_GUIDANCE } from "./trimester-content";

export interface PregnancyIntelligenceTodaySignals {
  mood: Mood[];
  energyLevel: number | null;
  sleepQuality: number | null;
  symptoms: Partial<Record<PregnancySymptomKey, PregnancySymptomSeverity>>;
}

export interface PregnancyIntelligenceInput {
  dating: PregnancyDatingResult;
  /** Null when nothing has been logged today. */
  today: PregnancyIntelligenceTodaySignals | null;
  /** Only ever PUBLISHED content — see week-content-actions.ts. */
  publishedWeekContent: Partial<Record<PregnancyWeekSection, string>>;
  /** From patterns-engine.ts: energy/sleep trend + recent symptom frequency, already computed. */
  patternSentences: PatternSentence[];
  focusAreas: PregnancyFocusArea[];
  safetyAlerts: PregnancySafetyAlert[];
}

export type PregnancySafetyLevel = "NORMAL" | "CONTACT_PROVIDER" | "URGENT";

export interface PregnancyIntelligenceOutput {
  pregnancy: { week: number; day: number; trimester: 1 | 2 | 3 };
  baby: { headline: string; development: string; developmentDetails: string[] };
  mother: { headline: string; bodyChanges: string[]; commonExperiences: string[] };
  today: { nutrition: string[]; hydration: string; movement: string; sleep: string; selfCare: string };
  personalized: { basedOnUserLogs: string[]; patterns: string[] };
  upcoming: { nextWeek: string; topicsToLearn: string[] };
  safety: { level: PregnancySafetyLevel; message: string };
}

const TRIMESTER_NUMBER: Record<PregnancyDatingResult["currentTrimester"], 1 | 2 | 3> = {
  first: 1,
  second: 2,
  third: 3,
};

const SYMPTOM_LABELS: Record<PregnancySymptomKey, string> = Object.fromEntries(
  PREGNANCY_SYMPTOM_OPTIONS.map((o) => [o.key, o.label]),
) as Record<PregnancySymptomKey, string>;

/**
 * Which body system explains a logged symptom, for the "why might I be
 * feeling this way" personalization. Deliberately excludes symptoms that
 * are also safety-rule triggers (fever, vision_changes, fluid_leaking,
 * fetal_movement, contractions before 37 weeks) from being framed as a
 * routine, reassuring "common experience" — those stay in the safety block
 * instead of being softened here. `contractions` is the one exception: it's
 * mapped for third-trimester Braxton-Hicks-vs-labor education, and can
 * still surface a safety alert in parallel via PregnancySafetyEngine.
 */
const SYMPTOM_BODY_SYSTEM: Partial<Record<PregnancySymptomKey, BodySystem>> = {
  nausea: "digestive",
  vomiting: "digestive",
  heartburn: "digestive",
  constipation: "digestive",
  bloating: "digestive",
  headache: "cardiovascular",
  back_discomfort: "musculoskeletal",
  pelvic_discomfort: "musculoskeletal",
  cramping: "reproductive_system",
  breast_tenderness: "breasts",
  swelling: "cardiovascular",
  shortness_of_breath: "respiratory",
  vaginal_discharge: "reproductive_system",
  spotting_bleeding: "reproductive_system",
  contractions: "reproductive_system",
};

const MOOD_KEYS_SUGGESTING_EMOTIONAL_SUPPORT: Mood[] = ["anxious", "irritable", "sad", "emotional", "stressed"];

const SEVERITY_RANK: Record<PregnancySymptomSeverity, number> = { severe: 3, moderate: 2, mild: 1 };

function deriveSafetyLevel(alerts: PregnancySafetyAlert[]): PregnancySafetyLevel {
  if (alerts.some((a) => a.severity === "urgent")) return "URGENT";
  if (alerts.length > 0) return "CONTACT_PROVIDER";
  return "NORMAL";
}

const DEFAULT_SAFETY_MESSAGE =
  "Nothing you entered today raises an immediate safety concern. As always, reach out to your prenatal care provider with any new or worsening symptoms.";

/**
 * "Why might I be feeling this way?" — built only from symptoms actually
 * logged today, each paired with its trimester-appropriate body-system
 * explanation. Ordered by severity (severe first) so the most relevant
 * explanation surfaces first. Never states a cause as fact.
 */
function buildBasedOnUserLogs(
  today: PregnancyIntelligenceTodaySignals | null,
  trimester: PregnancyDatingResult["currentTrimester"],
): string[] {
  if (!today) return [];
  const sentences: string[] = [];

  const symptomEntries = (Object.entries(today.symptoms) as [PregnancySymptomKey, PregnancySymptomSeverity][])
    .filter(([key]) => SYMPTOM_BODY_SYSTEM[key] !== undefined)
    .sort((a, b) => SEVERITY_RANK[b[1]] - SEVERITY_RANK[a[1]]);

  for (const [symptomKey] of symptomEntries) {
    const system = SYMPTOM_BODY_SYSTEM[symptomKey]!;
    const content = BODY_SYSTEM_CONTENT[system][trimester];
    sentences.push(`You mentioned ${SYMPTOM_LABELS[symptomKey].toLowerCase()} today. ${content.explanation}`);
  }

  if (today.mood.some((m) => MOOD_KEYS_SUGGESTING_EMOTIONAL_SUPPORT.includes(m))) {
    sentences.push(`Today sounds like it's been an emotional one. ${BODY_SYSTEM_CONTENT.emotional_wellbeing[trimester].explanation}`);
  }

  if (today.energyLevel != null && today.energyLevel <= 2) {
    sentences.push(`You mentioned feeling low on energy today. ${BODY_SYSTEM_CONTENT.energy[trimester].explanation}`);
  }

  if (today.sleepQuality != null && today.sleepQuality <= 2) {
    sentences.push(`You mentioned rougher sleep. ${BODY_SYSTEM_CONTENT.sleep[trimester].explanation}`);
  }

  return sentences.slice(0, 4);
}

/**
 * The single composer for the daily "five questions" experience: baby,
 * body, why-you-might-feel-this-way, what-to-do-today, and safety — built
 * from dating math, published (reviewed) content, trimester-level
 * fallbacks, and today's/recent logs. No generative AI and no diagnosis
 * anywhere in this function; gestational age, due date, and safety level
 * are all deterministic.
 */
export function buildPregnancyIntelligence(input: PregnancyIntelligenceInput): PregnancyIntelligenceOutput {
  const { dating, today, publishedWeekContent, patternSentences, safetyAlerts } = input;
  const trimester = dating.currentTrimester;
  const guidance = TRIMESTER_GUIDANCE[trimester];
  const nutrition = TRIMESTER_NUTRITION[trimester];

  const sortedAlerts = [...safetyAlerts].sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "urgent" ? -1 : 1));

  return {
    pregnancy: {
      week: dating.gestationalAgeWeeks,
      day: dating.gestationalAgeDays,
      trimester: TRIMESTER_NUMBER[trimester],
    },
    baby: {
      headline: "What's happening with your baby this week",
      development: publishedWeekContent.baby_development ?? guidance.babyDevelopment,
      developmentDetails: guidance.babyDevelopmentDetails,
    },
    mother: {
      headline: "What's happening in your body this week",
      bodyChanges: publishedWeekContent.body_changes ? [publishedWeekContent.body_changes] : guidance.bodyChangesList,
      commonExperiences: publishedWeekContent.what_you_may_notice
        ? [publishedWeekContent.what_you_may_notice]
        : guidance.commonExperiences,
    },
    today: {
      nutrition: publishedWeekContent.nutrition ? [publishedWeekContent.nutrition, ...nutrition.mealIdeas] : nutrition.mealIdeas,
      hydration: guidance.hydration,
      movement: publishedWeekContent.movement ?? guidance.movement,
      sleep: guidance.sleep,
      selfCare: publishedWeekContent.self_care ?? guidance.selfCare,
    },
    personalized: {
      basedOnUserLogs: buildBasedOnUserLogs(today, trimester),
      patterns: patternSentences.map((p) => p.sentence),
    },
    upcoming: {
      nextWeek: publishedWeekContent.coming_up ?? GENERIC_COMING_UP,
      topicsToLearn: guidance.topicsToLearn,
    },
    safety: {
      level: deriveSafetyLevel(safetyAlerts),
      message: sortedAlerts[0]?.message ?? DEFAULT_SAFETY_MESSAGE,
    },
  };
}
