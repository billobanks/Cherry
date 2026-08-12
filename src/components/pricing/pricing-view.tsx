import Link from "next/link";
import { FREE_PLAN, PREMIUM_PLAN } from "@/lib/subscription";
import type { CreateCheckoutSessionResult, SubscriptionPlan } from "@/lib/subscription";
import { PlanCard } from "./plan-card";
import { UpgradeButton } from "./upgrade-button";

export function PricingView({
  currentPlan,
  onCreateCheckoutSession,
}: {
  currentPlan: SubscriptionPlan;
  onCreateCheckoutSession: () => Promise<CreateCheckoutSessionResult>;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Pricing</span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">Free to start, deeper with Premium</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          Track your cycle for free, always. Premium adds personalized guidance built from your own logged
          patterns.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2 sm:items-start">
        <PlanCard plan={FREE_PLAN} isCurrentPlan={currentPlan === "free"} />
        <PlanCard
          plan={PREMIUM_PLAN}
          isCurrentPlan={currentPlan === "premium"}
          highlight
          action={
            currentPlan === "premium" ? (
              <Link
                href="/settings/subscription"
                className="flex h-12 w-full items-center justify-center rounded-full border border-border text-[15px] font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                Manage billing
              </Link>
            ) : (
              <UpgradeButton onCreateCheckoutSession={onCreateCheckoutSession} />
            )
          }
        />
      </div>

      <p className="px-1 text-center text-xs leading-relaxed text-muted-foreground">
        Cancel anytime from billing management. Premium features never diagnose or replace professional medical
        care.
      </p>
    </div>
  );
}
