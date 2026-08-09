"use client";

import { Pencil, X } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FLOW_OPTIONS, MOOD_OPTIONS } from "@/lib/checkin";
import { setIntercourseForDate, type CalendarDayDetail } from "@/lib/calendar";

function formatFullDate(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="mt-1 text-[15px] text-foreground">{children}</div>
    </div>
  );
}

export function DayDetailPanel({
  detail,
  fertilityTrackingEnabled,
  onClose,
}: {
  detail: CalendarDayDetail;
  fertilityTrackingEnabled: boolean;
  onClose: () => void;
}) {
  const flowLabel = detail.loggedFlow
    ? FLOW_OPTIONS.find((f) => f.value === detail.loggedFlow)?.label
    : null;
  const moodLabels = detail.mood
    .map((m) => MOOD_OPTIONS.find((o) => o.value === m))
    .filter((o): o is (typeof MOOD_OPTIONS)[number] => Boolean(o));

  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-heading text-xl font-medium">{formatFullDate(detail.date)}</h2>
          {detail.cycleDay ? (
            <p className="mt-0.5 text-sm text-muted-foreground">
              Cycle day {detail.cycleDay}
              {detail.phaseLabel ? ` · ${detail.phaseLabel}` : ""}
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-muted-foreground">Before your logged history</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {detail.isPredictedPeriod ? (
        <span className="mt-3 inline-block rounded-full border border-primary px-2.5 py-0.5 text-xs font-medium text-primary">
          Predicted period — not yet confirmed
        </span>
      ) : flowLabel && detail.loggedFlow !== "none" ? (
        <span className="mt-3 inline-block rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
          Logged period
        </span>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-4">
        <Field label="Flow">{flowLabel ?? "Not logged"}</Field>
        <Field label="Mood">
          {moodLabels.length > 0
            ? moodLabels.map((m) => `${m.emoji} ${m.label}`).join(", ")
            : "Not logged"}
        </Field>
        <Field label="Energy">{detail.energyLevel ? `${detail.energyLevel}/5` : "Not logged"}</Field>
        <Field label="Sleep">{detail.sleepQuality ? `${detail.sleepQuality}/5` : "Not logged"}</Field>
      </div>

      <div className="mt-4">
        <Field label="Symptoms">
          {detail.symptoms.length > 0 ? detail.symptoms.map((s) => s.label).join(", ") : "None logged"}
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Notes">{detail.notes || "No notes"}</Field>
      </div>

      {fertilityTrackingEnabled ? <IntercourseField date={detail.date} value={detail.intercourse} /> : null}

      {detail.dailyInsight ? (
        <div className="mt-4 rounded-xl bg-secondary/60 px-4 py-3">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Daily insight
          </span>
          <p className="mt-1 text-sm leading-relaxed text-foreground">{detail.dailyInsight}</p>
        </div>
      ) : null}

      <Link
        href={`/checkin?date=${detail.date}`}
        className="mt-5 flex h-12 w-full items-center justify-center gap-1.5 rounded-full bg-primary text-[15px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Pencil className="h-4 w-4" />
        {detail.hasCheckin ? "Edit this day" : "Add info for this day"}
      </Link>
    </div>
  );
}

function IntercourseField({ date, value }: { date: string; value: boolean | null }) {
  const [current, setCurrent] = useState(value);
  const [isPending, startTransition] = useTransition();

  function set(next: boolean) {
    const previous = current;
    setCurrent(next);
    startTransition(async () => {
      const result = await setIntercourseForDate(date, next);
      if (!result.success) {
        setCurrent(previous);
        toast.error(result.message ?? "Couldn't save that.");
      }
    });
  }

  return (
    <div className="mt-4">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Intercourse
      </span>
      <div className="mt-1.5 flex gap-2">
        {[
          { label: "Yes", val: true },
          { label: "No", val: false },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            disabled={isPending}
            aria-pressed={current === option.val}
            onClick={() => set(option.val)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${
              current === option.val
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary/40"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
