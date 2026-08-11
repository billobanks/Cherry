"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { SafetyAlertBanner } from "@/components/safety/safety-alert-banner";
import { Textarea } from "@/components/ui/textarea";
import {
  CHECKIN_SYMPTOM_OPTIONS,
  DISCHARGE_OPTIONS,
  ENERGY_SCALE_LABELS,
  EXERCISE_OPTIONS,
  FLOW_OPTIONS,
  LIBIDO_SCALE_LABELS,
  MOOD_OPTIONS,
  NOTES_MAX_LENGTH,
  PAIN_SCALE_LABELS,
  SLEEP_SCALE_LABELS,
  type CheckinFormValues,
} from "@/lib/checkin";
import { evaluateSafetySignals, type SafetyHistoryContext, type SafetyRuleContent } from "@/lib/safety";
import { ChipSelect } from "./chip-select";
import { ScaleSelector } from "./scale-selector";

export function CheckinForm({
  initialValues,
  isToday,
  onSave,
  safetyRules,
  safetyHistory,
}: {
  initialValues: CheckinFormValues;
  isToday: boolean;
  onSave: (values: CheckinFormValues) => Promise<{ success: boolean; message?: string }>;
  safetyRules: SafetyRuleContent[];
  safetyHistory: SafetyHistoryContext;
}) {
  const [values, setValues] = useState(initialValues);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const safetyAlerts = useMemo(
    () =>
      evaluateSafetySignals(
        {
          flow: values.flow,
          painSeverity: values.painSeverity,
          previousPainSeverity: safetyHistory.previousPainSeverity,
          symptomKeys: values.symptomKeys,
          priorConsecutiveBleedingDays: safetyHistory.priorConsecutiveBleedingDays,
          isOutsideExpectedBleedingWindow: safetyHistory.isOutsideExpectedBleedingWindow,
        },
        safetyRules,
      ),
    [values.flow, values.painSeverity, values.symptomKeys, safetyHistory, safetyRules],
  );

  function update<K extends keyof CheckinFormValues>(key: K, value: CheckinFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await onSave(values);
      if (!result.success) {
        toast.error(result.message ?? "Couldn't save — please try again.");
        return;
      }
      toast.success(result.message ?? "Check-in saved.");
      router.refresh();
    });
  }

  const formattedDate = new Date(`${values.checkinDate}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <div className="px-5 pt-8 sm:px-8">
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
          {isToday ? "Today's check-in" : "Editing a past check-in"}
        </span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">{formattedDate}</h1>
        {!isToday ? (
          <Link href="/checkin" className="mt-1 inline-block text-sm text-primary underline">
            Back to today
          </Link>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col gap-6 px-5 sm:px-8">
        <ChipSelect
          label="Flow"
          options={FLOW_OPTIONS}
          multi={false}
          value={values.flow}
          onChange={(v) => update("flow", v)}
        />

        <ChipSelect
          label="Mood"
          options={MOOD_OPTIONS}
          multi={true}
          value={values.mood}
          onChange={(v) => update("mood", v)}
        />

        <ScaleSelector
          label="Energy"
          value={values.energyLevel}
          onChange={(v) => update("energyLevel", v)}
          scaleLabels={ENERGY_SCALE_LABELS}
        />

        <ScaleSelector
          label="Sleep"
          value={values.sleepQuality}
          onChange={(v) => update("sleepQuality", v)}
          scaleLabels={SLEEP_SCALE_LABELS}
        />

        <ScaleSelector
          label="Pain"
          value={values.painSeverity}
          onChange={(v) => update("painSeverity", v)}
          scaleLabels={PAIN_SCALE_LABELS}
        />

        <ChipSelect
          label="Symptoms"
          options={CHECKIN_SYMPTOM_OPTIONS.map((s) => ({ value: s.key, label: s.label }))}
          multi={true}
          value={values.symptomKeys}
          onChange={(v) => update("symptomKeys", v)}
        />

        {safetyAlerts.length > 0 ? <SafetyAlertBanner alerts={safetyAlerts} /> : null}

        <ChipSelect
          label="Discharge (optional)"
          options={DISCHARGE_OPTIONS}
          multi={false}
          value={values.discharge}
          onChange={(v) => update("discharge", v)}
        />

        <ChipSelect
          label="Exercise"
          options={EXERCISE_OPTIONS}
          multi={false}
          value={values.exercise}
          onChange={(v) => update("exercise", v)}
        />

        <ScaleSelector
          label="Libido (optional)"
          value={values.libido}
          onChange={(v) => update("libido", v)}
          scaleLabels={LIBIDO_SCALE_LABELS}
        />

        <div>
          <label htmlFor="checkin-notes" className="text-sm font-medium text-foreground">
            Notes
          </label>
          <Textarea
            id="checkin-notes"
            value={values.notes}
            onChange={(e) => update("notes", e.target.value.slice(0, NOTES_MAX_LENGTH))}
            placeholder="Anything else worth remembering about today?"
            rows={3}
            className="mt-2 rounded-2xl"
          />
          <span className="mt-1 block text-right text-xs text-muted-foreground">
            {values.notes.length}/{NOTES_MAX_LENGTH}
          </span>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border/60 bg-background/85 px-5 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto w-full max-w-2xl">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex h-13 w-full items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground transition-opacity disabled:opacity-70"
          >
            {isPending ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : "Save check-in"}
          </button>
        </div>
      </div>
    </div>
  );
}
