import { notFound } from "next/navigation";
import { DailyInsightsView } from "@/components/insights/daily-insights-view";
import { generateDailyBodyInsight } from "@/lib/insights";

/**
 * Dev-only design preview: renders DailyInsightsView with fixture data and a
 * fake feedback handler, so the UI can be reviewed/screenshotted without a
 * live Supabase project. Not linked from anywhere in the app; 404s in prod.
 */
export default function InsightsPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const insight = generateDailyBodyInsight({
    date: "2026-08-08",
    cycleDay: 25,
    phase: "luteal",
    commonSymptomKeys: ["bloating", "insomnia", "mood_swings"],
    existingFeedback: { mood: "yes" },
    priorPhaseAgreementSections: ["mood", "skin"],
  });

  return (
    <DailyInsightsView
      insight={insight}
      onSubmitFeedback={async (input) => {
        "use server";
        console.log("[preview] would save", input);
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { success: true };
      }}
    />
  );
}
