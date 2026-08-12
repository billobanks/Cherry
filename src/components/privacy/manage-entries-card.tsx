"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FLOW_OPTIONS } from "@/lib/checkin";
import type { CheckinEntrySummary, CycleEntrySummary } from "@/lib/privacy";

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function ManageEntriesCard({
  cycles,
  checkins,
  onDeleteCycle,
  onDeleteCheckin,
}: {
  cycles: CycleEntrySummary[];
  checkins: CheckinEntrySummary[];
  onDeleteCycle: (cycleId: string) => Promise<{ success: boolean; message?: string }>;
  onDeleteCheckin: (checkinDate: string) => Promise<{ success: boolean; message?: string }>;
}) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDeleteCycle(cycle: CycleEntrySummary) {
    if (!window.confirm(`Delete the cycle starting ${formatDate(cycle.startDate)}? This can't be undone.`)) return;
    setPendingKey(cycle.id);
    startTransition(async () => {
      const result = await onDeleteCycle(cycle.id);
      if (!result.success) toast.error(result.message ?? "Couldn't delete that entry.");
      setPendingKey(null);
      router.refresh();
    });
  }

  function handleDeleteCheckin(checkin: CheckinEntrySummary) {
    if (!window.confirm(`Delete the check-in for ${formatDate(checkin.checkinDate)}? This can't be undone.`)) return;
    setPendingKey(checkin.checkinDate);
    startTransition(async () => {
      const result = await onDeleteCheckin(checkin.checkinDate);
      if (!result.success) toast.error(result.message ?? "Couldn't delete that entry.");
      setPendingKey(null);
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-card px-5 py-5">
      <h2 className="font-heading text-lg font-medium">Manage your entries</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Delete individual cycles or check-ins. This is permanent and can&apos;t be undone.
      </p>

      <div className="mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cycles</h3>
        {cycles.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No cycles logged yet.</p>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {cycles.map((cycle) => (
              <div
                key={cycle.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-2.5"
              >
                <span className="text-sm text-foreground">
                  Started {formatDate(cycle.startDate)}
                  {cycle.periodLengthDays ? ` · ${cycle.periodLengthDays}-day period` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteCycle(cycle)}
                  disabled={isPending}
                  aria-label="Delete cycle"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                >
                  {pendingKey === cycle.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Check-ins</h3>
        {checkins.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No check-ins logged yet.</p>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {checkins.map((checkin) => {
              const flowLabel = FLOW_OPTIONS.find((f) => f.value === checkin.flow)?.label;
              return (
                <div
                  key={checkin.checkinDate}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-2.5"
                >
                  <span className="text-sm text-foreground">
                    {formatDate(checkin.checkinDate)}
                    {flowLabel && flowLabel !== "None" ? ` · ${flowLabel} flow` : ""}
                    {checkin.symptomCount > 0 ? ` · ${checkin.symptomCount} symptoms` : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteCheckin(checkin)}
                    disabled={isPending}
                    aria-label="Delete check-in"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                  >
                    {pendingKey === checkin.checkinDate ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
