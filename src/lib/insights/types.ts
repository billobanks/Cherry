import type { CyclePhase } from "@/lib/cycle-engine";
import type { InsightFeedbackResponse, InsightSectionKey } from "@/types/database";

export type { InsightFeedbackResponse, InsightSectionKey };

export interface InsightSection {
  key: InsightSectionKey;
  title: string;
  summary: string;
  points: string[];
  /** Only present on the symptoms_to_monitor section — used to detect overlap with the user's reported common symptoms. */
  relatedSymptomKeys?: string[];
  /** Set when the user has previously said "yes" to this section during this phase, on an earlier day. */
  previouslyResonated?: boolean;
  /** The user's saved response for this section on this insight_date, if any. */
  existingResponse?: InsightFeedbackResponse | null;
}

export interface DailyBodyInsight {
  date: string;
  cycleDay: number;
  phase: CyclePhase;
  phaseLabel: string;
  sections: InsightSection[];
  disclaimers: {
    general: string;
    ovulation: string;
    notContraception: string;
  };
}
