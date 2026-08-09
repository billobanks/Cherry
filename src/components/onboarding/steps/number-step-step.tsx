"use client";

import { Minus, Plus } from "lucide-react";
import { StepShell } from "../step-shell";

export function NumberStepStep({
  stepIndex,
  eyebrow,
  title,
  description,
  value,
  defaultValue,
  min,
  max,
  unit,
  onChange,
  onBack,
  onSkip,
  onNext,
}: {
  stepIndex: number;
  eyebrow: string;
  title: string;
  description?: string;
  value: number | null;
  defaultValue: number;
  min: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
}) {
  const displayValue = value ?? defaultValue;

  function step(delta: number) {
    onChange(Math.min(max, Math.max(min, displayValue + delta)));
  }

  return (
    <StepShell
      stepIndex={stepIndex}
      eyebrow={eyebrow}
      title={title}
      description={description}
      onBack={onBack}
      onSkip={onSkip}
      primaryLabel={value !== null ? "Continue" : "Skip for now"}
      onPrimary={onNext}
    >
      <div className="flex flex-col items-center gap-8 pt-4">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label={`Decrease ${unit}`}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary active:scale-95"
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="flex w-28 flex-col items-center">
            <span className="font-heading text-6xl font-medium tabular-nums">
              {displayValue}
            </span>
            <span className="mt-1 text-sm text-muted-foreground">{unit}</span>
          </div>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label={`Increase ${unit}`}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary active:scale-95"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <input
          type="range"
          min={min}
          max={max}
          value={displayValue}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-1.5 w-full max-w-xs cursor-pointer appearance-none rounded-full bg-border accent-primary"
          aria-label={`Typical ${unit}`}
        />
        <div className="flex w-full max-w-xs justify-between font-mono text-xs tabular-nums text-muted-foreground">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    </StepShell>
  );
}
