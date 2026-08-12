"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChipSelect } from "@/components/checkin/chip-select";
import { ScaleSelector } from "@/components/checkin/scale-selector";
import { Textarea } from "@/components/ui/textarea";
import { MOOD_OPTIONS } from "@/lib/checkin";
import type { PregnancySafetyAlert } from "@/lib/pregnancy";
import {
  PREGNANCY_APPETITE_SCALE_LABELS,
  PREGNANCY_ENERGY_SCALE_LABELS,
  PREGNANCY_HYDRATION_SCALE_LABELS,
  PREGNANCY_NOTES_MAX_LENGTH,
  PREGNANCY_SLEEP_SCALE_LABELS,
  PREGNANCY_SYMPTOM_OPTIONS,
} from "@/lib/pregnancy/constants";
import type { PregnancyCheckinFormValues } from "@/lib/pregnancy/checkin-types";
import { PregnancySafetyAlertBanner } from "./pregnancy-safety-alert-banner";
import { SymptomSeverityPicker } from "./symptom-severity-picker";

export function PregnancyCheckinForm({
  initialValues,
  gestationalAgeWeeks,
  onSave,
}: {
  initialValues: PregnancyCheckinFormValues;
  gestationalAgeWeeks: number;
  onSave: (
    values: PregnancyCheckinFormValues,
  ) => Promise<{ status: string; safetyAlerts?: PregnancySafetyAlert[]; message?: string }>;
}) {
  const [values, setValues] = useState(initialValues);
  const [safetyAlerts, setSafetyAlerts] = useState<PregnancySafetyAlert[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function update<K extends keyof PregnancyCheckinFormValues>(key: K, value: PregnancyCheckinFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await onSave(values);
      if (result.status !== "ready") {
        toast.error(result.message ?? "Couldn't save — please try again.");
        return;
      }
      setSafetyAlerts(result.safetyAlerts ?? []);
      toast.success("Check-in saved.");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <div className="px-5 pt-8 sm:px-8">
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
          Today&apos;s check-in
        </span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">Week {gestationalAgeWeeks}</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">How are you feeling today?</p>
      </div>

      <div className="mt-6 flex flex-col gap-6 px-5 pb-32 sm:px-8">
        <ChipSelect label="Mood" options={MOOD_OPTIONS} multi={true} value={values.mood} onChange={(v) => update("mood", v)} />

        <ScaleSelector label="Energy" value={values.energyLevel} onChange={(v) => update("energyLevel", v)} scaleLabels={PREGNANCY_ENERGY_SCALE_LABELS} />
        <ScaleSelector label="Sleep" value={values.sleepQuality} onChange={(v) => update("sleepQuality", v)} scaleLabels={PREGNANCY_SLEEP_SCALE_LABELS} />
        <ScaleSelector label="Hydration" value={values.hydrationLevel} onChange={(v) => update("hydrationLevel", v)} scaleLabels={PREGNANCY_HYDRATION_SCALE_LABELS} />
        <ScaleSelector label="Appetite" value={values.appetiteLevel} onChange={(v) => update("appetiteLevel", v)} scaleLabels={PREGNANCY_APPETITE_SCALE_LABELS} />

        <SymptomSeverityPicker
          label="Symptoms"
          options={PREGNANCY_SYMPTOM_OPTIONS}
          value={values.symptoms}
          onChange={(v) => update("symptoms", v)}
        />

        {safetyAlerts.length > 0 ? <PregnancySafetyAlertBanner alerts={safetyAlerts} /> : null}

        <div>
          <label htmlFor="pregnancy-checkin-notes" className="text-sm font-medium text-foreground">
            Notes
          </label>
          <Textarea
            id="pregnancy-checkin-notes"
            value={values.notes}
            onChange={(e) => update("notes", e.target.value.slice(0, PREGNANCY_NOTES_MAX_LENGTH))}
            placeholder="Anything else worth remembering about today?"
            rows={3}
            className="mt-2 rounded-2xl"
          />
          <span className="mt-1 block text-right text-xs text-muted-foreground">
            {values.notes.length}/{PREGNANCY_NOTES_MAX_LENGTH}
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
