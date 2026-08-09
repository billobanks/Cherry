"use client";

import { useState } from "react";
import { toast } from "sonner";
import type {
  DailyBodyInsight,
  InsightFeedbackResponse,
  InsightSectionKey,
} from "@/lib/insights";
import { SECTION_ICONS } from "./section-icons";
import { SectionCard } from "./section-card";
import { TodayHeader } from "./today-header";

export function DailyInsightsView({
  insight,
  onSubmitFeedback,
}: {
  insight: DailyBodyInsight;
  /** Injected so this component has no direct dependency on the server action — keeps it easy to preview/test. */
  onSubmitFeedback: (input: {
    insightDate: string;
    cyclePhase: DailyBodyInsight["phase"];
    sectionKey: InsightSectionKey;
    response: InsightFeedbackResponse;
  }) => Promise<{ success: boolean; message?: string }>;
}) {
  const [responses, setResponses] = useState<Partial<Record<InsightSectionKey, InsightFeedbackResponse>>>(
    () =>
      Object.fromEntries(
        insight.sections
          .filter((s) => s.existingResponse != null)
          .map((s) => [s.key, s.existingResponse as InsightFeedbackResponse]),
      ),
  );

  async function handleRespond(sectionKey: InsightSectionKey, response: InsightFeedbackResponse) {
    const result = await onSubmitFeedback({
      insightDate: insight.date,
      cyclePhase: insight.phase,
      sectionKey,
      response,
    });

    if (!result.success) {
      toast.error(result.message ?? "Couldn't save that just now.");
      throw new Error(result.message ?? "save failed");
    }

    setResponses((prev) => ({ ...prev, [sectionKey]: response }));
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-5 py-8 sm:px-8">
      <TodayHeader cycleDay={insight.cycleDay} phaseLabel={insight.phaseLabel} date={insight.date} />

      <div className="rounded-2xl border border-border bg-card px-4 py-3.5 text-sm leading-relaxed text-muted-foreground">
        {insight.disclaimers.general} {insight.disclaimers.notContraception}
      </div>

      <div className="flex flex-col gap-3">
        {insight.sections.map((section) => (
          <SectionCard
            key={section.key}
            section={section}
            icon={SECTION_ICONS[section.key]}
            response={responses[section.key] ?? null}
            onRespond={(response) => handleRespond(section.key, response)}
          />
        ))}
      </div>
    </div>
  );
}
