import Link from "next/link";
import type { CreatePortalSessionResult, SubscriptionState } from "@/lib/subscription";
import { ManageBillingButton } from "./manage-billing-button";
import { StatusBadge } from "./status-badge";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function BillingView({
  state,
  onCreatePortalSession,
}: {
  state: SubscriptionState;
  onCreatePortalSession: () => Promise<CreatePortalSessionResult>;
}) {
  const isPremium = state.plan === "premium";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Billing</span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">Your plan</h1>
      </div>

      <div className="rounded-2xl border border-border bg-card px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-medium">{isPremium ? "Premium" : "Free"}</h2>
          {state.status ? <StatusBadge status={state.status} /> : null}
        </div>

        {isPremium && state.currentPeriodEnd ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {state.cancelAtPeriodEnd
              ? `Cancels on ${formatDate(state.currentPeriodEnd)} — you'll keep Premium access until then.`
              : `Renews on ${formatDate(state.currentPeriodEnd)}.`}
          </p>
        ) : null}

        {!isPremium ? (
          <p className="mt-2 text-sm text-muted-foreground">
            You&apos;re on the Free plan. Upgrade for detailed insights, nutrition and exercise guidance, the AI
            wellness assistant, and more.
          </p>
        ) : null}

        <div className="mt-5">
          {isPremium ? (
            <ManageBillingButton onCreatePortalSession={onCreatePortalSession} />
          ) : (
            <Link
              href="/pricing"
              className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-[15px] font-semibold text-primary-foreground"
            >
              Upgrade to Premium
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
