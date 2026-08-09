import { CYCLE_DISCLAIMERS, PHASE_LABELS, type CyclePhase } from "@/lib/cycle-engine";
import type { InsightFeedbackResponse, InsightSectionKey } from "@/types/database";
import { PHASE_SECTION_CONTENT } from "./content";
import { SECTION_ORDER, SECTION_TITLES } from "./sections";
import { labelForSymptomKey } from "./symptom-labels";
import type { DailyBodyInsight, InsightSection } from "./types";

export interface GenerateDailyBodyInsightParams {
  /** ISO yyyy-mm-dd — the day this insight is for. */
  date: string;
  cycleDay: number;
  phase: CyclePhase;
  /** The user's onboarding-reported commonly-experienced symptoms, if any. */
  commonSymptomKeys?: string[];
  /** This date's already-saved "Does this sound like you?" answers, if the user has responded today. */
  existingFeedback?: Partial<Record<InsightSectionKey, InsightFeedbackResponse>>;
  /** Sections the user has said "yes" to on an earlier day during this same phase. */
  priorPhaseAgreementSections?: InsightSectionKey[];
}

function joinWithAnd(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/**
 * Composes a full day's worth of body-insight content from cycle position,
 * phase-specific copy, and whatever personalization signal is available.
 * Pure — no I/O — so the same function works from a server action, a
 * scheduled job that pre-generates tomorrow's insight, or a test.
 */
export function generateDailyBodyInsight(
  params: GenerateDailyBodyInsightParams,
): DailyBodyInsight {
  const { phase, commonSymptomKeys = [], existingFeedback = {}, priorPhaseAgreementSections = [] } =
    params;
  const phaseContent = PHASE_SECTION_CONTENT[phase];
  const priorSet = new Set(priorPhaseAgreementSections);

  const sections: InsightSection[] = SECTION_ORDER.map((key) => {
    const copy = phaseContent[key];
    const points = [...copy.points];

    if (key === "symptoms_to_monitor" && copy.relatedSymptomKeys?.length) {
      const overlap = copy.relatedSymptomKeys.filter((symptomKey) =>
        commonSymptomKeys.includes(symptomKey),
      );
      if (overlap.length > 0) {
        const labels = overlap.map(labelForSymptomKey);
        points.push(
          `You mentioned ${joinWithAnd(labels)} as common for you — these can be more noticeable during this phase for some people.`,
        );
      }
    }

    const section: InsightSection = {
      key,
      title: SECTION_TITLES[key],
      summary: copy.summary,
      points,
      existingResponse: existingFeedback[key] ?? null,
      previouslyResonated: priorSet.has(key),
    };

    if (copy.relatedSymptomKeys) {
      section.relatedSymptomKeys = copy.relatedSymptomKeys;
    }

    return section;
  });

  return {
    date: params.date,
    cycleDay: params.cycleDay,
    phase,
    phaseLabel: PHASE_LABELS[phase],
    sections,
    disclaimers: CYCLE_DISCLAIMERS,
  };
}
