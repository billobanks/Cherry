"use client";

import { Loader2, Lock } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { BirthPreferences } from "@/lib/pregnancy/birth-preferences-actions";
import type { BirthPrepTopic } from "@/lib/pregnancy/topic-disclosure";

const FIELDS: { key: keyof BirthPreferences; label: string; placeholder: string }[] = [
  { key: "supportPeople", label: "Support people", placeholder: "Who do you want with you?" },
  { key: "painManagement", label: "Pain management preferences", placeholder: "What are you hoping for or considering?" },
  { key: "environment", label: "Environment preferences", placeholder: "Lighting, music, who's in the room, etc." },
  { key: "feedingPlan", label: "Feeding plan", placeholder: "Breastfeeding, formula, undecided — whatever's true for you" },
];

export function BirthPreparationView({
  initialPreferences,
  revealedTopics,
  upcomingTopics,
  onUpdate,
}: {
  initialPreferences: BirthPreferences;
  revealedTopics: BirthPrepTopic[];
  upcomingTopics: BirthPrepTopic[];
  onUpdate: (input: BirthPreferences) => Promise<{ success: boolean; message?: string }>;
}) {
  const [values, setValues] = useState(initialPreferences);
  const [isPending, startTransition] = useTransition();

  function update(key: keyof BirthPreferences, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await onUpdate(values);
      if (!result.success) {
        toast.error(result.message ?? "Couldn't save.");
        return;
      }
      toast.success("Saved.");
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Birth preparation</span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">Your birth preferences</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          There&apos;s no template to fill out perfectly — jot down what matters to you, and bring it to a
          prenatal visit to talk through with your provider.
        </p>
      </div>

      {revealedTopics.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-foreground">Worth learning about now</h2>
          {revealedTopics.map((topic) => (
            <div key={topic.key} className="rounded-2xl border border-border bg-card px-4 py-3">
              <p className="text-[15px] font-medium text-foreground">{topic.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{topic.blurb}</p>
            </div>
          ))}
        </div>
      ) : null}

      {upcomingTopics.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-foreground">Coming up later</h2>
          <div className="flex flex-col gap-2">
            {upcomingTopics.map((topic) => (
              <div key={topic.key} className="flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground">
                <Lock className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {topic.label} — around week {topic.revealFromWeek}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        {FIELDS.map((field) => (
          <div key={field.key} className="rounded-2xl border border-border bg-card px-5 py-4">
            <label className="text-sm font-medium text-foreground" htmlFor={field.key}>
              {field.label}
            </label>
            <textarea
              id={field.key}
              value={values[field.key]}
              onChange={(e) => update(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={2}
              className="mt-2 w-full rounded-2xl border border-border bg-secondary/40 px-3.5 py-2.5 text-[15px] outline-none focus:border-primary"
            />
          </div>
        ))}

        <div className="rounded-2xl border border-border bg-card px-5 py-4">
          <label className="text-sm font-medium text-foreground" htmlFor="notes">
            Other notes
          </label>
          <textarea
            id="notes"
            value={values.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={3}
            className="mt-2 w-full rounded-2xl border border-border bg-secondary/40 px-3.5 py-2.5 text-[15px] outline-none focus:border-primary"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-[15px] font-semibold text-primary-foreground disabled:opacity-70"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save preferences"}
      </button>
    </div>
  );
}
