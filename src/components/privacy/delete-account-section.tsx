"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { DeleteAccountResult } from "@/lib/privacy";
import { createClient } from "@/lib/supabase/client";

const CONFIRM_PHRASE = "DELETE";

export function DeleteAccountSection({
  onDeleteAccount,
}: {
  onDeleteAccount: () => Promise<DeleteAccountResult>;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const canDelete = confirmText === CONFIRM_PHRASE;

  function handleDelete() {
    if (!canDelete) return;
    startTransition(async () => {
      const result = await onDeleteAccount();
      if (result.status === "deleted") {
        const supabase = createClient();
        await supabase.auth.signOut();
        toast.success("Your account and data have been deleted.");
        router.push("/login");
        return;
      }
      if (result.status === "signed_out") {
        toast.error("Please sign in again.");
        return;
      }
      if (result.status === "rate_limited") {
        toast.error("Too many attempts — please wait and try again, or contact support.");
        return;
      }
      toast.error(result.message);
    });
  }

  return (
    <section className="rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
          <AlertTriangle className="h-4.5 w-4.5" />
        </span>
        <div>
          <h2 className="font-heading text-lg font-medium">Delete your account</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Permanently deletes your account and everything logged in it — cycles, check-ins, symptoms,
            conversations with Cherry, and preferences. Any active subscription is canceled first. This
            can&apos;t be undone.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <label htmlFor="delete-confirm" className="text-sm font-medium text-foreground">
          Type <span className="font-mono font-semibold">DELETE</span> to confirm
        </label>
        <input
          id="delete-confirm"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="h-11 rounded-xl border border-border bg-card px-3.5 text-[15px] outline-none focus-visible:border-destructive"
          autoComplete="off"
        />
      </div>

      <button
        type="button"
        onClick={handleDelete}
        disabled={!canDelete || isPending}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-destructive text-[15px] font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Permanently delete my account"}
      </button>
    </section>
  );
}
