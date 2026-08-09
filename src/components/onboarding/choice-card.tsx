"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";

interface ChoiceCardProps {
  label: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
  icon?: ReactNode;
}

export function ChoiceCard({
  label,
  description,
  selected,
  onSelect,
  icon,
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all ${
        selected
          ? "border-primary bg-accent"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      {icon ? <span className="mt-0.5 shrink-0 text-primary">{icon}</span> : null}
      <span className="flex-1">
        <span className="block text-[15px] font-medium leading-snug">
          {label}
        </span>
        {description ? (
          <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border text-transparent"
        }`}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    </button>
  );
}

export function ChoiceChip({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-primary/40"
      }`}
    >
      {label}
    </button>
  );
}
