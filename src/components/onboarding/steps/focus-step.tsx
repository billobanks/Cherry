"use client";

import { FOCUS_OPTIONS } from "@/lib/onboarding/constants";
import type { PrimaryFocus } from "@/types/database";
import { SingleChoiceStep } from "./single-choice-step";

export function FocusStep({
  stepIndex,
  value,
  onChange,
  onBack,
  onSkip,
  onNext,
}: {
  stepIndex: number;
  value: PrimaryFocus | null;
  onChange: (value: PrimaryFocus) => void;
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
}) {
  return (
    <SingleChoiceStep
      stepIndex={stepIndex}
      eyebrow="Getting oriented"
      title="What would you like help with?"
      description="This just tunes what we lead with — nothing is locked in."
      options={FOCUS_OPTIONS}
      value={value}
      onChange={onChange}
      onBack={onBack}
      onSkip={onSkip}
      onNext={onNext}
    />
  );
}
