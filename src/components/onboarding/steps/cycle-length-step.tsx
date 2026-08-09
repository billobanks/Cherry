"use client";

import { CYCLE_LENGTH_RANGE } from "@/lib/onboarding/constants";
import { NumberStepStep } from "./number-step-step";

export function CycleLengthStep({
  stepIndex,
  value,
  onChange,
  onBack,
  onSkip,
  onNext,
}: {
  stepIndex: number;
  value: number | null;
  onChange: (value: number) => void;
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
}) {
  return (
    <NumberStepStep
      stepIndex={stepIndex}
      eyebrow="Cycle basics"
      title="How long is your cycle, typically?"
      description="Counted from the first day of one period to the first day of the next."
      value={value}
      defaultValue={CYCLE_LENGTH_RANGE.default}
      min={CYCLE_LENGTH_RANGE.min}
      max={CYCLE_LENGTH_RANGE.max}
      unit="days"
      onChange={onChange}
      onBack={onBack}
      onSkip={onSkip}
      onNext={onNext}
    />
  );
}
