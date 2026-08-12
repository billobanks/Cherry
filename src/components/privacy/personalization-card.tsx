"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export function PersonalizationCard({
  initial,
  onUpdate,
}: {
  initial: boolean;
  onUpdate: (enabled: boolean) => Promise<{ success: boolean; message?: string }>;
}) {
  const [enabled, setEnabled] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function handleChange(value: boolean) {
    setEnabled(value);
    startTransition(async () => {
      const result = await onUpdate(value);
      if (!result.success) {
        setEnabled(!value);
        toast.error(result.message ?? "Couldn't save that setting.");
      }
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-card px-5 py-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-medium">Personalization</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            When on, features like the AI assistant use your logged cycle phase, symptoms, mood, sleep, and
            energy to personalize answers. When off, they give general guidance only.
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={handleChange} disabled={isPending} aria-label="Personalization" />
      </div>
    </section>
  );
}
