"use client";

import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import type { CreateCheckoutSessionResult } from "@/lib/subscription";

export function UpgradeButton({
  onCreateCheckoutSession,
}: {
  onCreateCheckoutSession: () => Promise<CreateCheckoutSessionResult>;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await onCreateCheckoutSession();
      if (result.status === "ready") {
        window.location.href = result.url;
        return;
      }
      if (result.status === "not_configured") {
        toast.error("Checkout isn't set up yet — an admin needs to add Stripe API keys.");
        return;
      }
      if (result.status === "signed_out") {
        toast.error("Please sign in again.");
        return;
      }
      if (result.status === "rate_limited") {
        toast.error("Too many attempts — please wait a bit and try again.");
        return;
      }
      toast.error(result.message);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-[15px] font-semibold text-primary-foreground transition-opacity disabled:opacity-70"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upgrade to Premium"}
    </button>
  );
}
