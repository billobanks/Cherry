"use client";

import { GOAL_OPTIONS } from "@/lib/onboarding/constants";
import type { Goal } from "@/types/database";
import { MultiChoiceStep } from "./multi-choice-step";

export function GoalsStep({
  stepIndex,
  values,
  onToggle,
  onBack,
  onSkip,
  onNext,
}: {
  stepIndex: number;
  values: Goal[];
  onToggle: (value: Goal) => void;
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
}) {
  return (
    <MultiChoiceStep
      stepIndex={stepIndex}
      eyebrow="Wellness goals"
      title="What are you hoping to get out of Cherry?"
      description="Pick as many as apply — this shapes your daily insights."
      options={GOAL_OPTIONS}
      values={values}
      onToggle={(v) => onToggle(v as Goal)}
      onBack={onBack}
      onSkip={onSkip}
      onNext={onNext}
    />
  );
}
