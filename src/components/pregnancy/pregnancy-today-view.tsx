import type { PregnancySafetyAlert } from "@/lib/pregnancy";
import type { PregnancyTodayOutput } from "@/lib/pregnancy/dashboard-actions";
import type { PregnancyIntelligenceOutput } from "@/lib/pregnancy/intelligence-engine";
import type { WeeklyWelcomeSummary } from "@/lib/pregnancy/weekly-welcome-actions";
import type { PregnancyChecklistItemKey } from "@/types/database";
import { BabyThisWeekCard, BodyThisWeekCard } from "./baby-body-cards";
import { ComingUpCard } from "./coming-up-card";
import { NewlyPregnantChecklist } from "./newly-pregnant-checklist";
import { PersonalizedInsightsCard } from "./personalized-insights-card";
import { PregnancyCheckinCta } from "./pregnancy-checkin-cta";
import { PregnancyHeader } from "./pregnancy-header";
import { PregnancyQuickLinks } from "./pregnancy-quick-links";
import { PregnancySafetyAlertBanner } from "./pregnancy-safety-alert-banner";
import { TodaySection } from "./today-section";
import { WeeklyWelcomeModal } from "./weekly-welcome-modal";
import { WhatToKnowCards } from "./what-to-know-cards";

export function PregnancyTodayView({
  displayName,
  today,
  hasLoggedToday,
  safetyAlerts,
  checklistCompletedKeys,
  onToggleChecklistItem,
  weeklyWelcome,
  onDismissWeeklyWelcome,
  onSaveWeeklyWelcome,
  personalized,
}: {
  displayName: string | null;
  today: PregnancyTodayOutput;
  hasLoggedToday: boolean;
  safetyAlerts: PregnancySafetyAlert[];
  checklistCompletedKeys: PregnancyChecklistItemKey[];
  onToggleChecklistItem: (itemKey: PregnancyChecklistItemKey) => Promise<{ status: string; completed?: boolean; message?: string }>;
  weeklyWelcome: WeeklyWelcomeSummary | null;
  onDismissWeeklyWelcome: (weekNumber: number) => Promise<{ success: boolean }>;
  onSaveWeeklyWelcome: (weekNumber: number) => Promise<{ success: boolean }>;
  personalized: PregnancyIntelligenceOutput["personalized"] | null;
}) {
  return (
    <div className="pb-12">
      {weeklyWelcome ? (
        <WeeklyWelcomeModal summary={weeklyWelcome} onDismiss={onDismissWeeklyWelcome} onSave={onSaveWeeklyWelcome} />
      ) : null}

      <PregnancyHeader
        displayName={displayName}
        gestationalAgeWeeks={today.gestationalAgeWeeks}
        gestationalAgeDays={today.gestationalAgeDays}
        trimester={today.trimester}
        estimatedDueDate={today.estimatedDueDate}
        percentComplete={today.percentComplete}
      />

      <div className="mx-auto mt-6 flex w-full max-w-2xl flex-col gap-6 px-5 sm:px-8">
        {safetyAlerts.length > 0 ? <PregnancySafetyAlertBanner alerts={safetyAlerts} /> : null}

        {today.trimester === "first" ? (
          <NewlyPregnantChecklist initialCompletedKeys={checklistCompletedKeys} onToggle={onToggleChecklistItem} />
        ) : null}

        <BabyThisWeekCard content={today.babyDevelopment} />
        <BodyThisWeekCard content={today.bodyChanges} />
        {personalized ? (
          <PersonalizedInsightsCard basedOnUserLogs={personalized.basedOnUserLogs} patterns={personalized.patterns} />
        ) : null}
        <TodaySection today={today} hasLoggedToday={hasLoggedToday} />
        <WhatToKnowCards articles={today.recommendedArticles} />
        <ComingUpCard content={today.comingUp} />
        <PregnancyCheckinCta hasLoggedToday={hasLoggedToday} />
        <PregnancyQuickLinks />

        <p className="px-1 text-center text-xs leading-relaxed text-muted-foreground">
          Educational estimates only — not a diagnosis, not a determination of fetal health, and never a
          substitute for prenatal care. Gestational age and due date are estimates and are labeled as such.
        </p>
      </div>
    </div>
  );
}
