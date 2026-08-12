"use client";

import { Loader2, Square, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import type { ContractionWithStats } from "@/lib/pregnancy/contraction-engine";
import type { LogDeliveryInput, LogDeliveryResult } from "@/lib/pregnancy/delivery-actions";
import type { ContractionIntensity } from "@/types/database";
import { DeliveryLogForm } from "./delivery-log-form";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatSeconds(seconds: number | null): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ContractionTrackerView({
  contractions,
  activeContractionId,
  onStart,
  onEnd,
  onDelete,
  onLogDelivery,
}: {
  contractions: ContractionWithStats[];
  activeContractionId: string | null;
  onStart: () => Promise<{ success: boolean; message?: string; id?: string }>;
  onEnd: (id: string, intensity: ContractionIntensity | null) => Promise<{ success: boolean; message?: string }>;
  onDelete: (id: string) => Promise<{ success: boolean; message?: string }>;
  onLogDelivery: (input: LogDeliveryInput) => Promise<LogDeliveryResult>;
}) {
  const router = useRouter();
  const [activeId, setActiveId] = useState(activeContractionId);
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!activeId || startedAt == null) return;
    const interval = setInterval(() => setElapsed(Math.round((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [activeId, startedAt]);

  function handleStart() {
    startTransition(async () => {
      const result = await onStart();
      if (!result.success || !result.id) {
        toast.error(result.message ?? "Couldn't start tracking.");
        return;
      }
      setActiveId(result.id);
      setStartedAt(Date.now());
      setElapsed(0);
    });
  }

  function handleEnd(intensity: ContractionIntensity | null) {
    if (!activeId) return;
    startTransition(async () => {
      const result = await onEnd(activeId, intensity);
      if (!result.success) {
        toast.error(result.message ?? "Couldn't save.");
        return;
      }
      setActiveId(null);
      setStartedAt(null);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Labor</span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">Contraction tracking</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          This helps you track timing to discuss with your provider — it doesn&apos;t determine whether labor is
          safe to manage at home. Contact your provider or go to your planned delivery location per their
          guidance.
        </p>
      </div>

      <section className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-5 py-8">
        {activeId ? (
          <>
            <p className="font-heading text-4xl font-medium tabular-nums">{formatSeconds(elapsed)}</p>
            <p className="text-sm text-muted-foreground">Contraction in progress</p>
            <div className="mt-2 flex gap-2">
              {(["mild", "moderate", "strong"] as ContractionIntensity[]).map((intensity) => (
                <button
                  key={intensity}
                  type="button"
                  onClick={() => handleEnd(intensity)}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium capitalize transition-colors hover:border-primary/40 disabled:opacity-50"
                >
                  <Square className="h-3 w-3" />
                  {intensity}
                </button>
              ))}
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={handleStart}
            disabled={isPending}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-70"
          >
            {isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : <span className="text-xs font-semibold">Start</span>}
          </button>
        )}
      </section>

      <section>
        <h2 className="px-1 font-heading text-lg font-medium">Recent contractions</h2>
        {contractions.length === 0 ? (
          <p className="mt-2 px-1 text-sm text-muted-foreground">Nothing logged yet.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {contractions.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                <div className="text-sm text-foreground">
                  <span className="font-medium">{formatTime(c.startedAt)}</span>
                  <span className="ml-2 text-muted-foreground">
                    Duration {formatSeconds(c.durationSeconds)}
                    {c.intervalSinceLastSeconds != null ? ` · ${Math.round(c.intervalSinceLastSeconds / 60)} min since last` : ""}
                    {c.intensity ? ` · ${c.intensity}` : ""}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => startTransition(async () => { await onDelete(c.id); router.refresh(); })}
                  aria-label="Delete entry"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <DeliveryLogForm onLogDelivery={onLogDelivery} />
    </div>
  );
}
