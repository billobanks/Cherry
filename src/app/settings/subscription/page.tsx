import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BillingView } from "@/components/billing/billing-view";
import { createPortalSession, getSubscriptionState } from "@/lib/subscription";

export const metadata: Metadata = {
  title: "Billing — Cherry",
};

export default async function BillingPage() {
  const result = await getSubscriptionState();
  if (result.status === "signed_out") {
    redirect("/login");
  }

  return <BillingView state={result.state} onCreatePortalSession={createPortalSession} />;
}
