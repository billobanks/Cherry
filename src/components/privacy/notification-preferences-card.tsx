"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { NOTIFICATION_OPTIONS } from "@/lib/onboarding/constants";
import type { NotificationPreferenceRow } from "@/lib/privacy";
import type { NotificationCategory } from "@/types/database";

export function NotificationPreferencesCard({
  initial,
  onUpdate,
}: {
  initial: NotificationPreferenceRow[];
  onUpdate: (category: NotificationCategory, enabled: boolean) => Promise<{ success: boolean; message?: string }>;
}) {
  const [prefs, setPrefs] = useState(new Map(initial.map((p) => [p.category, p.enabled])));
  const [pendingCategory, startTransition] = useTransition();

  function handleToggle(category: NotificationCategory, enabled: boolean) {
    const prev = new Map(prefs);
    setPrefs((current) => new Map(current).set(category, enabled));

    startTransition(async () => {
      const result = await onUpdate(category, enabled);
      if (!result.success) {
        setPrefs(prev);
        toast.error(result.message ?? "Couldn't save that setting.");
      }
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-card px-5 py-5">
      <h2 className="font-heading text-lg font-medium">Notifications</h2>
      <p className="mt-1 text-sm text-muted-foreground">All opt-in — nothing is sent unless you turn it on.</p>

      <div className="mt-4 flex flex-col divide-y divide-border">
        {NOTIFICATION_OPTIONS.map((option) => (
          <div key={option.value} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div>
              <span className="text-[15px] font-medium text-foreground">{option.label}</span>
              <p className="mt-0.5 text-xs text-muted-foreground">{option.description}</p>
            </div>
            <Switch
              checked={prefs.get(option.value) ?? false}
              onCheckedChange={(checked) => handleToggle(option.value, checked)}
              disabled={pendingCategory}
              aria-label={option.label}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
