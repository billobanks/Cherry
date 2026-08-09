"use client";

import { ChoiceChip } from "../choice-card";
import { StepShell } from "../step-shell";

export function MultiChoiceStep({
  stepIndex,
  eyebrow,
  title,
  description,
  options,
  values,
  onToggle,
  onBack,
  onSkip,
  onNext,
}: {
  stepIndex: number;
  eyebrow: string;
  title: string;
  description?: string;
  options: { value: string; label: string }[];
  values: string[];
  onToggle: (value: string) => void;
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
}) {
  return (
    <StepShell
      stepIndex={stepIndex}
      eyebrow={eyebrow}
      title={title}
      description={description}
      onBack={onBack}
      onSkip={onSkip}
      primaryLabel={values.length > 0 ? "Continue" : "Skip for now"}
      onPrimary={onNext}
    >
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <ChoiceChip
            key={option.value}
            label={option.label}
            selected={values.includes(option.value)}
            onSelect={() => onToggle(option.value)}
          />
        ))}
      </div>
    </StepShell>
  );
}
