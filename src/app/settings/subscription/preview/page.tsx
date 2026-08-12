import { notFound } from "next/navigation";
import { BillingView } from "@/components/billing/billing-view";
import type { SubscriptionState } from "@/lib/subscription";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function BillingPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const state: SubscriptionState = {
    plan: "premium",
    status: "active",
    currentPeriodEnd: "2026-09-15T00:00:00Z",
    cancelAtPeriodEnd: false,
  };

  return (
    <BillingView
      state={state}
      onCreatePortalSession={async () => {
        "use server";
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { status: "not_configured" as const };
      }}
    />
  );
}
