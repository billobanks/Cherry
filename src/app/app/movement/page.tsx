import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MovementView } from "@/components/movement/movement-view";
import { PremiumUpgradePrompt } from "@/components/subscription/premium-upgrade-prompt";
import { getMovementRecommendation } from "@/lib/movement";
import { PREMIUM_FEATURE_KEYS } from "@/lib/subscription";

export const metadata: Metadata = {
  title: "Movement — Cherry",
};

export default async function MovementPage() {
  const result = await getMovementRecommendation();

  if (result.status === "signed_out") {
    redirect("/login");
  }

  if (result.status === "premium_required") {
    return <PremiumUpgradePrompt featureDescription={PREMIUM_FEATURE_KEYS.movement} />;
  }

  if (result.status === "needs_period_date") {
    return (
      <EmptyState
        title="Log a period to get movement suggestions"
        description="These are built around your estimated cycle phase — once you've logged a period start date, they'll show up here."
      />
    );
  }

  if (result.status === "error") {
    return <EmptyState title="Something went wrong" description={result.message} />;
  }

  return (
    <MovementView
      recommendation={result.recommendation}
      hasLoggedToday={result.hasLoggedToday}
      workoutPreferences={result.workoutPreferences}
    />
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-heading text-2xl font-medium text-balance">{title}</h1>
      <p className="text-[15px] leading-relaxed text-muted-foreground text-pretty">{description}</p>
      <Link
        href="/app/check-in"
        className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
      >
        Go to check-in
      </Link>
    </div>
  );
}
