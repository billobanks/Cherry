"use client";

import { useState } from "react";
import { lastPeriodStartDateSchema } from "@/lib/onboarding/schema";
import type { FlowIntensity } from "@/types/database";
import { ChoiceChip } from "../choice-card";
import { StepShell } from "../step-shell";

const FLOW_OPTIONS: { value: FlowIntensity; label: string }[] = [
  { value: "spotting", label: "Spotting" },
  { value: "light", label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "heavy", label: "Heavy" },
];

const today = () => new Date().toISOString().slice(0, 10);

export function LastPeriodStep({
  stepIndex,
  date,
  flowIntensity,
  onChangeDate,
  onChangeFlow,
  onBack,
  onSkip,
  onNext,
}: {
  stepIndex: number;
  date: string | null;
  flowIntensity: FlowIntensity | null;
  onChangeDate: (value: string | null) => void;
  onChangeFlow: (value: FlowIntensity) => void;
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  function handleContinue() {
    if (!date) {
      onNext();
      return;
    }
    const result = lastPeriodStartDateSchema.safeParse(date);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "That date doesn't look right.");
      return;
    }
    setError(null);
    onNext();
  }

  return (
    <StepShell
      stepIndex={stepIndex}
      eyebrow="Cycle basics"
      title="When did your last period start?"
      description="This is the biggest lever for a first estimate — but a good guess is fine."
      onBack={onBack}
      onSkip={onSkip}
      primaryLabel={date ? "Continue" : "Skip for now"}
      onPrimary={handleContinue}
      errorMessage={error}
    >
      <div className="flex flex-col gap-6">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">
            Start date
          </span>
          <input
            type="date"
            value={date ?? ""}
            max={today()}
            onChange={(e) => {
              setError(null);
              onChangeDate(e.target.value || null);
            }}
            className="h-13 w-full rounded-2xl border border-border bg-card px-4 text-[15px] text-foreground outline-none transition-colors focus:border-primary"
          />
        </label>

        {date ? (
          <div className="flex flex-col gap-2.5">
            <span className="text-sm font-medium text-foreground">
              How heavy was it? <span className="text-muted-foreground font-normal">(optional)</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {FLOW_OPTIONS.map((option) => (
                <ChoiceChip
                  key={option.value}
                  label={option.label}
                  selected={flowIntensity === option.value}
                  onSelect={() => onChangeFlow(option.value)}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </StepShell>
  );
}
