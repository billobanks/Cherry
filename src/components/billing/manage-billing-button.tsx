"use client";

import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import type { CreatePortalSessionResult } from "@/lib/subscription";

export function ManageBillingButton({
  onCreatePortalSession,
}: {
  onCreatePortalSession: () => Promise<CreatePortalSessionResult>;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await onCreatePortalSession();
      if (result.status === "ready") {
        window.location.href = result.url;
        return;
      }
      if (result.status === "not_configured") {
        toast.error("Billing management isn't set up yet — an admin needs to add Stripe API keys.");
        return;
      }
      if (result.status === "no_customer") {
        toast.error("No billing account yet — upgrade to Premium first.");
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
      className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border text-[15px] font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-70"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Manage billing"}
    </button>
  );
}
