import { notFound } from "next/navigation";
import { PregnancyTodayView } from "@/components/pregnancy/pregnancy-today-view";
import type { PregnancyTodayOutput } from "@/lib/pregnancy/dashboard-actions";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function PregnancyDashboardPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const today: PregnancyTodayOutput = {
    gestationalAgeWeeks: 18,
    gestationalAgeDays: 3,
    trimester: "second",
    estimatedDueDate: "2026-12-18",
    daysUntilEstimatedDueDate: 132,
    percentComplete: 45,
    babyDevelopment:
      "Around this week, many people notice movement becoming easier to feel — often described as flutters at first. Your baby's proportions continue to even out, and features keep developing.",
    bodyChanges:
      "A more noticeable belly is common by now. Some people also notice changes in skin, appetite, and energy as blood volume continues increasing.",
    todayInsight: "Energy often returns for many people in the second trimester, though this varies from person to person.",
    nutritionSuggestion: "Iron and calcium needs commonly increase now — many people find appetite for more varied meals returns around this point.",
    movementSuggestion: "Many people feel more energy in the second trimester and can maintain or gradually build movement, as approved by their provider.",
    hydrationSuggestion: "Fluid needs typically increase as blood volume expands — keeping water accessible through the day can help.",
    sleepSuggestion: "Sleep is often more comfortable now, though finding a good position can take some adjusting.",
    emotionalWellnessSuggestion: "Many people describe this stretch as an emotional \"settling in\" period, though this varies widely.",
    symptomEducation: [
      { key: "heartburn", label: "Heartburn", blurb: "Heartburn is commonly reported as pregnancy progresses, often related to hormonal changes and reduced space for digestion." },
    ],
    safetyStatus: "clear",
    recommendedArticles: [
      { title: "This week's baby development", blurb: "Movement often becomes easier to feel around this week — a common early milestone many people look forward to." },
      { title: "Managing heartburn", blurb: "Smaller meals, staying upright after eating, and avoiding trigger foods are commonly suggested approaches." },
      { title: "Preparing for your anatomy scan", blurb: "Many providers schedule a detailed ultrasound around this window — a good time to prepare questions." },
    ],
    questionsForProvider: [
      "Is there anything about my anatomy scan or screening results you'd like to discuss?",
      "What does typical fetal movement feel like at this stage, and when should I start tracking it?",
    ],
    comingUp: "In the next few weeks, many people start feeling more regular fetal movement and may be scheduled for an anatomy scan if they haven't had one yet.",
  };

  return (
    <PregnancyTodayView
      displayName="Maya"
      today={today}
      hasLoggedToday={false}
      safetyAlerts={[]}
      checklistCompletedKeys={["schedule_prenatal_care"]}
      onToggleChecklistItem={async () => {
        "use server";
        return { status: "ready" as const, completed: true };
      }}
      weeklyWelcome={{
        weekNumber: 18,
        babyDevelopment: today.babyDevelopment,
        bodyChanges: today.bodyChanges,
      }}
      onDismissWeeklyWelcome={async () => {
        "use server";
        return { success: true };
      }}
      onSaveWeeklyWelcome={async () => {
        "use server";
        return { success: true };
      }}
      personalized={{
        basedOnUserLogs: [
          "You mentioned heartburn today. Hormones relax the valve between the stomach and esophagus, which can let stomach acid move upward more easily.",
        ],
        patterns: ["Your energy has generally felt a bit higher this week than last week."],
      }}
    />
  );
}
