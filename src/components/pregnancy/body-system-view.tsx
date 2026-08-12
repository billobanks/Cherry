"use client";

import { useState } from "react";
import { BODY_SYSTEM_CONTENT, BODY_SYSTEM_LABELS, type BodySystem } from "@/lib/pregnancy/body-system-content";
import type { Trimester } from "@/types/database";

const SYSTEM_ORDER: BodySystem[] = [
  "hormones",
  "cardiovascular",
  "respiratory",
  "digestive",
  "urinary",
  "musculoskeletal",
  "skin",
  "breasts",
  "reproductive_system",
  "sleep",
  "energy",
  "emotional_wellbeing",
];

export function BodySystemView({ gestationalAgeWeeks, trimester }: { gestationalAgeWeeks: number; trimester: Trimester }) {
  const [selected, setSelected] = useState<BodySystem | null>(null);
  const content = selected ? BODY_SYSTEM_CONTENT[selected][trimester] : null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Week {gestationalAgeWeeks}</span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">Why am I feeling this way?</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          Pick a body system to learn what&apos;s commonly going on there at this point in your pregnancy.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {SYSTEM_ORDER.map((system) => (
          <button
            key={system}
            type="button"
            onClick={() => setSelected(system)}
            aria-pressed={selected === system}
            className={`rounded-2xl border px-3 py-3 text-center text-sm font-medium transition-colors ${
              selected === system
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary/40"
            }`}
          >
            {BODY_SYSTEM_LABELS[system]}
          </button>
        ))}
      </div>

      {content ? (
        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-border bg-card px-5 py-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{content.headline}</span>
            <p className="mt-1.5 text-[15px] leading-relaxed text-foreground">{content.explanation}</p>
          </section>

          <section className="rounded-2xl border border-border bg-card px-5 py-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What may help</span>
            <ul className="mt-2 flex flex-col gap-1.5">
              {content.whatMayHelp.map((tip) => (
                <li key={tip} className="flex gap-2 text-[15px] leading-relaxed text-foreground">
                  <span className="text-primary" aria-hidden>
                    •
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card px-5 py-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What to monitor</span>
            <ul className="mt-2 flex flex-col gap-1.5">
              {content.whatToMonitor.map((tip) => (
                <li key={tip} className="flex gap-2 text-[15px] leading-relaxed text-foreground">
                  <span className="text-primary" aria-hidden>
                    •
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
              When to discuss with your provider
            </span>
            <p className="mt-1.5 text-[15px] leading-relaxed text-foreground">{content.whenToContactProvider}</p>
          </section>

          <p className="px-1 text-center text-xs leading-relaxed text-muted-foreground">
            This is general education, not a diagnosis of what&apos;s causing your symptoms — your provider can
            evaluate your specific situation.
          </p>
        </div>
      ) : (
        <p className="px-1 text-center text-sm text-muted-foreground">Select a body system above to see what&apos;s common.</p>
      )}
    </div>
  );
}
