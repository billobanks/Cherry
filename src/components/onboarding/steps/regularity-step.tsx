"use client";

import { REGULARITY_OPTIONS } from "@/lib/onboarding/constants";
import type { CycleRegularity } from "@/types/database";
import { SingleChoiceStep } from "./single-choice-step";

export function RegularityStep({
  stepIndex,
  value,
  onChange,
  onBack,
  onSkip,
  onNext,
}: {
  stepIndex: number;
  value: CycleRegularity | null;
  onChange: (value: CycleRegularity) => void;
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
}) {
  return (
    <SingleChoiceStep
      stepIndex={stepIndex}
      eyebrow="Cycle regularity"
      title="How regular is your cycle, usually?"
      description="This shapes how confident we are in any estimate we show you."
      options={REGULARITY_OPTIONS}
      value={value}
      onChange={onChange}
      onBack={onBack}
      onSkip={onSkip}
      onNext={onNext}
    />
  );
}
