import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PregnancyPatternsView } from "@/components/pregnancy/pregnancy-patterns-view";
import { PremiumUpgradePrompt } from "@/components/subscription/premium-upgrade-prompt";
import { getPregnancyPatterns } from "@/lib/pregnancy/patterns-actions";
import { PREMIUM_FEATURE_KEYS } from "@/lib/subscription";

export const metadata: Metadata = {
  title: "My patterns — Cherry",
};

export default async function PregnancyPatternsPage() {
  const result = await getPregnancyPatterns();

  if (result.status === "signed_out") {
    redirect("/login");
  }
  if (result.status === "no_active_pregnancy") {
    redirect("/app/pregnancy/activate");
  }
  if (result.status === "premium_required") {
    return <PremiumUpgradePrompt featureDescription={PREMIUM_FEATURE_KEYS.patterns} />;
  }
  if (result.status === "error") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-[15px] text-muted-foreground">{result.message}</p>
      </div>
    );
  }

  return <PregnancyPatternsView patterns={result.patterns} hasAnyData={result.hasAnyData} />;
}
