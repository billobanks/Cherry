"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { toggleFertilityTracking } from "@/lib/calendar";

export function FertilityToggle({ enabled }: { enabled: boolean }) {
  const [checked, setChecked] = useState(enabled);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleChange(value: boolean) {
    setChecked(value);
    startTransition(async () => {
      const result = await toggleFertilityTracking(value);
      if (!result.success) {
        setChecked(!value);
        toast.error(result.message ?? "Couldn't update that setting.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3.5">
      <div>
        <span className="text-[15px] font-medium text-foreground">Fertility tracking</span>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Adds an intercourse layer to your calendar. Off by default.
        </p>
      </div>
      <Switch checked={checked} onCheckedChange={handleChange} disabled={isPending} />
    </div>
  );
}
