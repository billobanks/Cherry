import { notFound } from "next/navigation";
import { CheckinForm } from "@/components/checkin/checkin-form";
import { RecentEntries } from "@/components/checkin/recent-entries";
import { emptyCheckinFormValues, type CheckinSummary } from "@/lib/checkin";
import type { SafetyHistoryContext, SafetyRuleContent } from "@/lib/safety";

/** Dev-only design preview — mirrors src/app/insights/preview. 404s in production. */
export default function CheckinPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const todayISO = "2026-08-08";
  // Flow + dizziness are pre-set so the safety banner is visible on load —
  // this fixture exists specifically to design-review that banner.
  const initialValues = {
    ...emptyCheckinFormValues(todayISO),
    flow: "heavy" as const,
    mood: ["stressed" as const],
    symptomKeys: ["dizziness"],
  };

  const safetyRules: SafetyRuleContent[] = [
    {
      ruleKey: "heavy_bleeding",
      label: "Unusually heavy bleeding",
      severity: "routine",
      message: "Bleeding that's heavier than what's typical for you can have several possible causes.",
      active: true,
      params: {},
    },
    {
      ruleKey: "dizziness_with_heavy_bleeding",
      label: "Dizziness with heavy bleeding",
      severity: "urgent",
      message:
        "Feeling dizzy along with heavier bleeding can have several possible causes, and together they're more than typical cycle discomfort.",
      active: true,
      params: {},
    },
    {
      ruleKey: "severe_or_worsening_pain",
      label: "Severe or rapidly worsening pain",
      severity: "urgent",
      message:
        "Pain that's severe, or that's getting noticeably worse quickly, can have several possible causes and is more than typical cycle discomfort.",
      active: true,
      params: {},
    },
    {
      ruleKey: "fainting",
      label: "Fainting",
      severity: "urgent",
      message: "Fainting, or feeling like you might faint, can have several possible causes, and some warrant prompt attention.",
      active: true,
      params: {},
    },
    {
      ruleKey: "unusual_bleeding_pattern",
      label: "Unusual bleeding pattern",
      severity: "routine",
      message: "Bleeding outside of when you'd expect your period can have several possible causes.",
      active: true,
      params: {},
    },
    {
      ruleKey: "prolonged_bleeding",
      label: "Prolonged bleeding",
      severity: "routine",
      message: "Bleeding that continues longer than what's typical for you can have several possible causes.",
      active: true,
      params: { thresholdDays: 8 },
    },
  ];

  const safetyHistory: SafetyHistoryContext = {
    previousPainSeverity: 2,
    priorConsecutiveBleedingDays: 3,
    isOutsideExpectedBleedingWindow: false,
  };

  const recentEntries: CheckinSummary[] = [
    {
      checkinDate: "2026-08-08",
      flow: "medium",
      mood: ["stressed", "calm"],
      energyLevel: 2,
      sleepQuality: 3,
      symptomCount: 2,
      hasNotes: true,
    },
    {
      checkinDate: "2026-08-07",
      flow: "light",
      mood: ["happy"],
      energyLevel: 4,
      sleepQuality: 4,
      symptomCount: 0,
      hasNotes: false,
    },
    {
      checkinDate: "2026-08-06",
      flow: "none",
      mood: [],
      energyLevel: null,
      sleepQuality: null,
      symptomCount: 1,
      hasNotes: false,
    },
  ];

  return (
    <div className="pb-28">
      <CheckinForm
        initialValues={initialValues}
        isToday
        onSave={async () => {
          "use server";
          // Preview only — no real save, and deliberately not logging the
          // check-in payload even here (fixture data), to keep this pattern
          // consistent with the "never log health data" rule everywhere.
          await new Promise((resolve) => setTimeout(resolve, 300));
          return { success: true, message: "Check-in saved." };
        }}
        safetyRules={safetyRules}
        safetyHistory={safetyHistory}
      />
      <div className="mx-auto mt-10 w-full max-w-2xl">
        <h2 className="px-5 font-heading text-xl font-medium sm:px-8">Recent entries</h2>
        <p className="mt-1 px-5 text-sm text-muted-foreground sm:px-8">Tap any day to edit it.</p>
        <div className="mt-4">
          <RecentEntries entries={recentEntries} todayISO={todayISO} />
        </div>
      </div>
    </div>
  );
}
