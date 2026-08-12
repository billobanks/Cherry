import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DailyInsightsView } from "@/components/insights/daily-insights-view";
import { getDailyBodyInsight, submitInsightFeedback } from "@/lib/insights/actions";

export const metadata: Metadata = {
  title: "Today's insights — Cherry",
};

export default async function TodayInsightsPage() {
  const result = await getDailyBodyInsight();

  if (result.status === "signed_out") {
    redirect("/login");
  }

  if (result.status === "needs_period_date") {
    return (
      <EmptyState
        title="Log your last period to see today's insights"
        description="Daily Body Insights are built around where you are in your cycle — once you've logged a period start date, they'll show up here."
        ctaLabel="Go to dashboard"
        ctaHref="/app/today"
      />
    );
  }

  if (result.status === "error") {
    return (
      <EmptyState
        title="Something went wrong"
        description={result.message}
        ctaLabel="Go to dashboard"
        ctaHref="/app/today"
      />
    );
  }

  return <DailyInsightsView insight={result.insight} onSubmitFeedback={submitInsightFeedback} />;
}

function EmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-heading text-2xl font-medium text-balance">{title}</h1>
      <p className="text-[15px] leading-relaxed text-muted-foreground text-pretty">{description}</p>
      <Link
        href={ctaHref}
        className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
