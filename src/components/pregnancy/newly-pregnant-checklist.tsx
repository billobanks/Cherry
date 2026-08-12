"use client";

import { Check } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { NEWLY_PREGNANT_CHECKLIST } from "@/lib/pregnancy/checklist-content";
import type { PregnancyChecklistItemKey } from "@/types/database";

export function NewlyPregnantChecklist({
  initialCompletedKeys,
  onToggle,
}: {
  initialCompletedKeys: PregnancyChecklistItemKey[];
  onToggle: (itemKey: PregnancyChecklistItemKey) => Promise<{ status: string; completed?: boolean; message?: string }>;
}) {
  const [completed, setCompleted] = useState(new Set(initialCompletedKeys));
  const [, startTransition] = useTransition();

  function handleToggle(itemKey: PregnancyChecklistItemKey) {
    const wasCompleted = completed.has(itemKey);
    setCompleted((prev) => {
      const next = new Set(prev);
      if (wasCompleted) next.delete(itemKey);
      else next.add(itemKey);
      return next;
    });

    startTransition(async () => {
      const result = await onToggle(itemKey);
      if (result.status !== "ready") {
        // Revert on failure.
        setCompleted((prev) => {
          const next = new Set(prev);
          if (wasCompleted) next.add(itemKey);
          else next.delete(itemKey);
          return next;
        });
        toast.error(result.message ?? "Couldn't update your checklist.");
      }
    });
  }

  const completedCount = completed.size;

  return (
    <section className="rounded-2xl border border-border bg-card px-5 py-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-medium text-foreground">Newly pregnant checklist</h2>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{NEWLY_PREGNANT_CHECKLIST.length}
        </span>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {NEWLY_PREGNANT_CHECKLIST.map((item) => {
          const isCompleted = completed.has(item.key);
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleToggle(item.key)}
              aria-pressed={isCompleted}
              className="flex items-start gap-3 rounded-xl px-1 py-1.5 text-left transition-opacity hover:opacity-80"
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  isCompleted ? "border-primary bg-primary text-primary-foreground" : "border-border"
                }`}
                aria-hidden
              >
                {isCompleted ? <Check className="h-3 w-3" /> : null}
              </span>
              <span className="flex-1">
                <span className={`block text-[15px] ${isCompleted ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {item.label}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{item.detail}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
