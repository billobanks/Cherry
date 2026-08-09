"use client";

import { NOTIFICATION_OPTIONS } from "@/lib/onboarding/constants";
import { Switch } from "@/components/ui/switch";
import type { NotificationCategory } from "@/types/database";
import { StepShell } from "../step-shell";

export function NotificationsStep({
  stepIndex,
  values,
  onToggle,
  onBack,
  onSkip,
  onNext,
}: {
  stepIndex: number;
  values: Record<NotificationCategory, boolean>;
  onToggle: (category: NotificationCategory) => void;
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
}) {
  return (
    <StepShell
      stepIndex={stepIndex}
      eyebrow="Staying in touch"
      title="Want a nudge now and then?"
      description="Everything below starts off. Turn on only what's useful — change it anytime in Settings."
      onBack={onBack}
      onSkip={onSkip}
      primaryLabel="Continue"
      onPrimary={onNext}
    >
      <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
        {NOTIFICATION_OPTIONS.map((option) => (
          <label
            key={option.value}
            htmlFor={`notif-${option.value}`}
            className="flex items-center gap-3 px-4 py-3.5"
          >
            <span className="flex-1">
              <span className="block text-[15px] font-medium leading-snug">
                {option.label}
              </span>
              <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">
                {option.description}
              </span>
            </span>
            <Switch
              id={`notif-${option.value}`}
              checked={values[option.value]}
              onCheckedChange={() => onToggle(option.value)}
            />
          </label>
        ))}
      </div>
    </StepShell>
  );
}
