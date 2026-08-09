"use client";

import type { SymptomOption } from "@/lib/onboarding/data";
import { MultiChoiceStep } from "./multi-choice-step";

export function SymptomsStep({
  stepIndex,
  options,
  values,
  onToggle,
  onBack,
  onSkip,
  onNext,
}: {
  stepIndex: number;
  options: SymptomOption[];
  values: string[];
  onToggle: (key: string) => void;
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
}) {
  return (
    <MultiChoiceStep
      stepIndex={stepIndex}
      eyebrow="Symptoms"
      title="Which of these show up for you most cycles?"
      description="General patterns only — no need to be exact, and nothing here is a diagnosis."
      options={options.map((s) => ({ value: s.key, label: s.label }))}
      values={values}
      onToggle={onToggle}
      onBack={onBack}
      onSkip={onSkip}
      onNext={onNext}
    />
  );
}
