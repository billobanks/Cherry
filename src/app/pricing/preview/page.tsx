import { notFound } from "next/navigation";
import { PricingView } from "@/components/pricing/pricing-view";

/** Dev-only design preview — mirrors the other feature preview routes. 404s in production. */
export default function PricingPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <PricingView
      currentPlan="free"
      onCreateCheckoutSession={async () => {
        "use server";
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { status: "not_configured" as const };
      }}
    />
  );
}
