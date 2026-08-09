"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChipSelect } from "@/components/checkin/chip-select";
import { MOVEMENT_CATALOG, MOVEMENT_ORDER, updateWorkoutPreferences, type MovementType } from "@/lib/movement";

export function WorkoutPreferencesCard({ initial }: { initial: MovementType[] }) {
  const [preferences, setPreferences] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    startTransition(async () => {
      const result = await updateWorkoutPreferences(preferences);
      if (!result.success) {
        toast.error(result.message ?? "Couldn't save your preferences.");
        return;
      }
      toast.success("Preferences saved.");
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-card px-5 py-5">
      <h2 className="font-heading text-lg font-medium">Workout preferences</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        We&apos;ll favor these when they fit today&apos;s recommendation — but never over what your
        logged energy and symptoms call for.
      </p>

      <div className="mt-4">
        <ChipSelect
          label="Types you enjoy"
          options={MOVEMENT_ORDER.map((key) => ({ value: key, label: MOVEMENT_CATALOG[key].label }))}
          multi={true}
          value={preferences}
          onChange={setPreferences}
        />
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="mt-4 flex h-11 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-70"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save preferences"}
      </button>
    </section>
  );
}
