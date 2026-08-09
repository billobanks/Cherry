"use client";

import { ChoiceCard } from "../choice-card";
import { StepShell } from "../step-shell";

interface Option<T extends string> {
  value: T;
  label: string;
  description?: string;
}

export function SingleChoiceStep<T extends string>({
  stepIndex,
  eyebrow,
  title,
  description,
  options,
  value,
  onChange,
  onBack,
  onSkip,
  onNext,
}: {
  stepIndex: number;
  eyebrow: string;
  title: string;
  description?: string;
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
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
      primaryLabel={value ? "Continue" : "Skip for now"}
      onPrimary={onNext}
    >
      <div className="flex flex-col gap-2.5">
        {options.map((option) => (
          <ChoiceCard
            key={option.value}
            label={option.label}
            description={option.description}
            selected={value === option.value}
            onSelect={() => onChange(option.value)}
          />
        ))}
      </div>
    </StepShell>
  );
}
