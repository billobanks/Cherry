import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PostpartumView } from "@/components/pregnancy/postpartum-view";
import { PregnancyEndedView } from "@/components/pregnancy/pregnancy-ended-view";
import { PregnancyTodayView } from "@/components/pregnancy/pregnancy-today-view";
import {
  getPregnancyChecklist,
  getPregnancyIntelligence,
  getPregnancyToday,
  getWeeklyWelcome,
  markWeeklyWelcomeSeen,
  saveWeeklySummary,
  togglePregnancyChecklistItem,
} from "@/lib/pregnancy";

export const metadata: Metadata = {
  title: "Your pregnancy — Cherry",
};

export default async function PregnancyPage() {
  const result = await getPregnancyToday();

  if (result.status === "signed_out") {
    redirect("/login");
  }
  if (result.status === "no_pregnancy") {
    redirect("/app/pregnancy/activate");
  }
  if (result.status === "pregnancy_ended") {
    return <PregnancyEndedView displayName={result.displayName} />;
  }
  if (result.status === "delivered") {
    return <PostpartumView displayName={result.displayName} deliveryDate={result.deliveryDate} />;
  }
  if (result.status === "error") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-[15px] text-muted-foreground">{result.message}</p>
      </div>
    );
  }

  const [checklistResult, weeklyWelcomeResult, intelligenceResult] = await Promise.all([
    getPregnancyChecklist(),
    getWeeklyWelcome(),
    getPregnancyIntelligence(),
  ]);

  return (
    <PregnancyTodayView
      displayName={result.displayName}
      today={result.today}
      hasLoggedToday={result.hasLoggedToday}
      safetyAlerts={result.safetyAlerts}
      checklistCompletedKeys={checklistResult.status === "ready" ? checklistResult.completedKeys : []}
      onToggleChecklistItem={togglePregnancyChecklistItem}
      weeklyWelcome={weeklyWelcomeResult.status === "ready" && weeklyWelcomeResult.show ? weeklyWelcomeResult.summary : null}
      onDismissWeeklyWelcome={markWeeklyWelcomeSeen}
      onSaveWeeklyWelcome={saveWeeklySummary}
      personalized={intelligenceResult.status === "ready" ? intelligenceResult.intelligence.personalized : null}
    />
  );
}
