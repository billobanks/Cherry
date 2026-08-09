"use client";

import { PERIOD_LENGTH_RANGE } from "@/lib/onboarding/constants";
import { NumberStepStep } from "./number-step-step";

export function PeriodDurationStep({
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
      title="How many days does your period usually last?"
      value={value}
      defaultValue={PERIOD_LENGTH_RANGE.default}
      min={PERIOD_LENGTH_RANGE.min}
      max={PERIOD_LENGTH_RANGE.max}
      unit="days"
      onChange={onChange}
      onBack={onBack}
      onSkip={onSkip}
      onNext={onNext}
    />
  );
}
