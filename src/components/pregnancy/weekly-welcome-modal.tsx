"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { WeeklyWelcomeSummary } from "@/lib/pregnancy/weekly-welcome-actions";

export function WeeklyWelcomeModal({
  summary,
  onDismiss,
  onSave,
}: {
  summary: WeeklyWelcomeSummary;
  onDismiss: (weekNumber: number) => Promise<{ success: boolean }>;
  onSave: (weekNumber: number) => Promise<{ success: boolean }>;
}) {
  const [open, setOpen] = useState(true);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function close() {
    setOpen(false);
    startTransition(async () => {
      await onDismiss(summary.weekNumber);
      router.refresh();
    });
  }

  function handleSave() {
    setSaved(true);
    startTransition(async () => {
      const result = await onSave(summary.weekNumber);
      if (!result.success) {
        setSaved(false);
        toast.error("Couldn't save this week.");
      }
    });
  }

  async function handleShare() {
    const shareText = `Week ${summary.weekNumber} of my pregnancy!\n\n${summary.babyDevelopment}\n\n${summary.bodyChanges}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `Week ${summary.weekNumber}`, text: shareText });
        return;
      } catch {
        // User canceled the share sheet — fall through to clipboard as a backup.
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
      toast.success("Copied — paste it anywhere to share with your partner.");
    }
  }

  function handleAskAssistant() {
    router.push("/app/pregnancy/assistant");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-t-3xl border border-border bg-background px-6 py-7 sm:rounded-3xl">
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
          Welcome to week {summary.weekNumber}
        </span>
        <h2 className="mt-2 font-heading text-2xl font-medium text-balance">Here&apos;s what&apos;s new this week</h2>

        <div className="mt-5 flex flex-col gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your baby this week</span>
            <p className="mt-1 text-[15px] leading-relaxed text-foreground">{summary.babyDevelopment}</p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your body this week</span>
            <p className="mt-1 text-[15px] leading-relaxed text-foreground">{summary.bodyChanges}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="rounded-full border border-border px-3 py-2.5 text-sm font-medium text-foreground disabled:opacity-60"
          >
            {saved ? "Saved" : "Save"}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="rounded-full border border-border px-3 py-2.5 text-sm font-medium text-foreground"
          >
            Share
          </button>
          <button
            type="button"
            onClick={handleAskAssistant}
            className="rounded-full border border-border px-3 py-2.5 text-sm font-medium text-foreground"
          >
            Ask
          </button>
        </div>

        <button
          type="button"
          onClick={close}
          disabled={isPending}
          className="mt-3 flex h-11 w-full items-center justify-center rounded-full bg-primary text-[15px] font-semibold text-primary-foreground disabled:opacity-70"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
