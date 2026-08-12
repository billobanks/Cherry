import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PricingView } from "@/components/pricing/pricing-view";
import { createCheckoutSession, getSubscriptionState } from "@/lib/subscription";

export const metadata: Metadata = {
  title: "Pricing — Cherry",
};

export default async function PricingPage() {
  const result = await getSubscriptionState();
  if (result.status === "signed_out") {
    redirect("/login");
  }

  return <PricingView currentPlan={result.state.plan} onCreateCheckoutSession={createCheckoutSession} />;
}
