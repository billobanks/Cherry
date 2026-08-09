"use client";

import { Check } from "lucide-react";
import { useState, useTransition } from "react";
import type { InsightFeedbackResponse } from "@/lib/insights";

const OPTIONS: { value: InsightFeedbackResponse; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "a_little", label: "A little" },
  { value: "no", label: "No" },
];

export function FeedbackControl({
  value,
  onRespond,
}: {
  value: InsightFeedbackResponse | null;
  onRespond: (response: InsightFeedbackResponse) => Promise<void>;
}) {
  const [selected, setSelected] = useState(value);
  const [isPending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  function handleClick(response: InsightFeedbackResponse) {
    const previous = selected;
    setSelected(response);
    setFailed(false);
    startTransition(async () => {
      try {
        await onRespond(response);
      } catch {
        setSelected(previous);
        setFailed(true);
      }
    });
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      <p className="text-sm font-medium text-foreground">Does this sound like you?</p>
      <div className="mt-2.5 flex gap-2" role="group" aria-label="Does this sound like you?">
        {OPTIONS.map((option) => {
          const isSelected = selected === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              disabled={isPending}
              onClick={() => handleClick(option.value)}
              className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/40"
              }`}
            >
              {isSelected ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
              {option.label}
            </button>
          );
        })}
      </div>
      {failed ? (
        <p className="mt-2 text-xs text-destructive">Couldn&apos;t save that — try again.</p>
      ) : null}
    </div>
  );
}
