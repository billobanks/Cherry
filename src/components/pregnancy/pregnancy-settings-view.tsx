"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChipSelect } from "@/components/checkin/chip-select";
import { Switch } from "@/components/ui/switch";
import type { EndPregnancyResult } from "@/lib/pregnancy";
import type { PregnancyNotificationPreference } from "@/lib/pregnancy/notification-actions";
import type { NotificationPreviewDetail, PregnancyNotificationCategory } from "@/types/database";

const CATEGORY_LABELS: Record<PregnancyNotificationCategory, { label: string; description: string }> = {
  weekly_milestone: { label: "Weekly milestones", description: "A nudge when a new pregnancy week begins." },
  appointment_reminder: { label: "Appointment reminders", description: "Reminders ahead of upcoming prenatal appointments." },
  daily_checkin_reminder: { label: "Daily check-in reminder", description: "A gentle nudge if you haven't logged today." },
  safety_follow_up: { label: "Safety follow-ups", description: "A check-in prompt after a symptom you logged was flagged." },
};

const PREVIEW_OPTIONS: { value: NotificationPreviewDetail; label: string }[] = [
  { value: "private", label: "Private" },
  { value: "detailed", label: "Detailed" },
];

export function PregnancySettingsView({
  initialPreferences,
  initialPreviewDetail,
  onToggleCategory,
  onUpdatePreviewDetail,
  onEndPregnancy,
}: {
  initialPreferences: PregnancyNotificationPreference[];
  initialPreviewDetail: NotificationPreviewDetail;
  onToggleCategory: (category: PregnancyNotificationCategory, enabled: boolean) => Promise<{ success: boolean; message?: string }>;
  onUpdatePreviewDetail: (previewDetail: NotificationPreviewDetail) => Promise<{ success: boolean; message?: string }>;
  onEndPregnancy: () => Promise<EndPregnancyResult>;
}) {
  const router = useRouter();
  const [preferences, setPreferences] = useState(new Map(initialPreferences.map((p) => [p.category, p.enabled])));
  const [previewDetail, setPreviewDetail] = useState(initialPreviewDetail);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleToggle(category: PregnancyNotificationCategory, enabled: boolean) {
    setPreferences((prev) => new Map(prev).set(category, enabled));
    startTransition(async () => {
      const result = await onToggleCategory(category, enabled);
      if (!result.success) toast.error(result.message ?? "Couldn't save that setting.");
    });
  }

  function handlePreviewChange(value: NotificationPreviewDetail) {
    setPreviewDetail(value);
    startTransition(async () => {
      const result = await onUpdatePreviewDetail(value);
      if (!result.success) toast.error(result.message ?? "Couldn't save that setting.");
    });
  }

  function handleEndPregnancy() {
    startTransition(async () => {
      const result = await onEndPregnancy();
      if (result.status !== "ready") {
        toast.error("message" in result ? result.message : "Couldn't update your pregnancy status.");
        return;
      }
      router.push("/app/pregnancy");
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Settings</span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">Pregnancy settings</h1>
      </div>

      <section className="rounded-2xl border border-border bg-card px-5 py-5">
        <h2 className="font-heading text-lg font-medium">Notifications</h2>
        <p className="mt-1 text-sm text-muted-foreground">All opt-in — nothing is sent unless you turn it on.</p>
        <div className="mt-4 flex flex-col divide-y divide-border">
          {initialPreferences.map((pref) => {
            const info = CATEGORY_LABELS[pref.category];
            return (
              <div key={pref.category} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div>
                  <span className="text-[15px] font-medium text-foreground">{info.label}</span>
                  <p className="mt-0.5 text-xs text-muted-foreground">{info.description}</p>
                </div>
                <Switch
                  checked={preferences.get(pref.category) ?? false}
                  onCheckedChange={(checked) => handleToggle(pref.category, checked)}
                  disabled={isPending}
                  aria-label={info.label}
                />
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card px-5 py-5">
        <h2 className="font-heading text-lg font-medium">Notification previews</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Private shows a generic message (&quot;You have a new update&quot;). Detailed can show specifics
          (&quot;You&apos;re 22 weeks today&quot;) — only turn this on if you&apos;re comfortable with that
          appearing on your lock screen.
        </p>
        <div className="mt-3">
          <ChipSelect label="" options={PREVIEW_OPTIONS} multi={false} value={previewDetail} onChange={handlePreviewChange} />
        </div>
      </section>

      <section className="rounded-2xl border border-border px-5 py-5">
        {!confirmingEnd ? (
          <button
            type="button"
            onClick={() => setConfirmingEnd(true)}
            className="text-sm font-medium text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-foreground"
          >
            This pregnancy isn&apos;t continuing
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm leading-relaxed text-foreground">
              We&apos;re sorry. This will turn off pregnancy tracking, milestones, and related notifications for
              this pregnancy. Your logged data isn&apos;t deleted — you can manage or remove it anytime from the
              privacy center.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleEndPregnancy}
                disabled={isPending}
                className="flex h-10 items-center justify-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-foreground disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingEnd(false)}
                className="flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium text-muted-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
