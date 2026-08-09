import { notFound } from "next/navigation";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { addDays, calculateCycleInsights, formatISODate, parseISODate } from "@/lib/cycle-engine";
import { computeUpcomingChanges, type DashboardData } from "@/lib/dashboard";
import { PHASE_SECTION_CONTENT, SECTION_TITLES } from "@/lib/insights";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function DashboardPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const today = "2026-08-08";
  const mostRecentPeriodStartDate = formatISODate(addDays(parseISODate(today), -20)); // cycle day 21

  const cycleInsights = calculateCycleInsights({
    mostRecentPeriodStartDate,
    averageCycleLengthDays: 27, // day 21 of 27 -> next period in 7 days, matching the brief's example
    averagePeriodDurationDays: 5,
    cycleVariability: "somewhat_irregular",
    today,
  });

  const phaseContent = PHASE_SECTION_CONTENT[cycleInsights.currentPhase];

  const data: DashboardData = {
    displayName: "Sarah",
    today: cycleInsights.today,
    currentCycleDay: cycleInsights.currentCycleDay,
    cycleLengthDays: cycleInsights.effectiveCycleLengthDays,
    phase: cycleInsights.currentPhase,
    phaseLabel: "Estimated luteal phase",
    phases: cycleInsights.phases,
    nextPeriod: {
      date: cycleInsights.estimatedNextPeriod.date,
      daysUntil: cycleInsights.estimatedNextPeriod.daysUntil,
      confidence: cycleInsights.estimatedNextPeriod.confidence,
    },
    todaysInsight: {
      headline: phaseContent.energy.summary,
      explanation: phaseContent.energy.points[0],
    },
    todaysBody: {
      hasLoggedToday: true,
      mood: ["stressed", "calm"],
      energyLevel: 2,
      sleepQuality: 3,
      hasCravings: true,
    },
    upcomingChanges: computeUpcomingChanges({
      today: cycleInsights.today,
      currentCycleDay: cycleInsights.currentCycleDay,
      phases: cycleInsights.phases,
      nextPeriodDate: cycleInsights.estimatedNextPeriod.date,
    }),
    recommended: (["nutrition", "exercise", "self_care", "sleep"] as const).map((key) => ({
      key,
      title: SECTION_TITLES[key],
      teaser: phaseContent[key].points[0] ?? phaseContent[key].summary,
    })),
    patterns: [
      { symptomKey: "headache", label: "Headache", occurrences: 3, eligibleCycles: 4 },
      { symptomKey: "bloating", label: "Bloating", occurrences: 2, eligibleCycles: 4 },
    ],
  };

  return <DashboardView data={data} />;
}
