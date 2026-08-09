import type { DashboardData } from "@/lib/dashboard";
import { GreetingHeader } from "./greeting-header";
import { MyPatterns } from "./my-patterns";
import { NextFewDays } from "./next-few-days";
import { RecommendedToday } from "./recommended-today";
import { TodaysBodyCard } from "./todays-body-card";
import { TodaysInsightCard } from "./todays-insight-card";

export function DashboardView({ data }: { data: DashboardData }) {
  return (
    <div className="pb-12">
      <GreetingHeader displayName={data.displayName} data={data} />

      <div className="mx-auto mt-6 flex w-full max-w-2xl flex-col gap-6 px-5 sm:px-8">
        <TodaysInsightCard
          headline={data.todaysInsight.headline}
          explanation={data.todaysInsight.explanation}
        />
        <TodaysBodyCard body={data.todaysBody} />
        <NextFewDays changes={data.upcomingChanges} />
        <RecommendedToday cards={data.recommended} />
        <MyPatterns patterns={data.patterns} />

        <p className="px-1 text-center text-xs leading-relaxed text-muted-foreground">
          Estimates only — not a diagnosis, and never a substitute for contraception or medical
          advice.
        </p>
      </div>
    </div>
  );
}
