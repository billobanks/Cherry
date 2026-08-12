"use client";

import { useState } from "react";
import { BODY_AREA_CONTENT, type BodyArea } from "@/lib/pregnancy/body-map-content";

const AREA_ORDER: BodyArea[] = [
  "head",
  "breasts",
  "chest",
  "abdomen",
  "pelvis",
  "back",
  "skin",
  "legs",
  "feet",
  "digestive_system",
  "bladder",
  "emotions",
];

export function BodyMapView({ gestationalAgeWeeks }: { gestationalAgeWeeks: number }) {
  const [selected, setSelected] = useState<BodyArea | null>(null);
  const content = selected ? BODY_AREA_CONTENT[selected] : null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Week {gestationalAgeWeeks}</span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">What is happening to my body?</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          Tap an area to learn about common pregnancy-related changes there.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {AREA_ORDER.map((area) => (
          <button
            key={area}
            type="button"
            onClick={() => setSelected(area)}
            aria-pressed={selected === area}
            className={`rounded-2xl border px-2 py-3 text-center text-sm font-medium transition-colors ${
              selected === area
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary/40"
            }`}
          >
            {BODY_AREA_CONTENT[area].label}
          </button>
        ))}
      </div>

      {content ? (
        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-border bg-card px-5 py-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              What may be happening
            </span>
            <p className="mt-1.5 text-[15px] leading-relaxed text-foreground">{content.whatMayBeHappening}</p>
          </section>

          <section className="rounded-2xl border border-border bg-card px-5 py-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Why it can happen during pregnancy
            </span>
            <p className="mt-1.5 text-[15px] leading-relaxed text-foreground">{content.whyItCanHappen}</p>
          </section>

          <section className="rounded-2xl border border-border bg-card px-5 py-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Things that may help
            </span>
            <ul className="mt-2 flex flex-col gap-1.5">
              {content.thingsThatMayHelp.map((tip) => (
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
              When to discuss it with your provider
            </span>
            <p className="mt-1.5 text-[15px] leading-relaxed text-foreground">{content.whenToDiscuss}</p>
          </section>

          <section className="rounded-2xl border border-destructive/40 bg-destructive/10 px-5 py-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-destructive">
              When urgent medical attention may be appropriate
            </span>
            <p className="mt-1.5 text-[15px] leading-relaxed text-foreground">{content.whenUrgent}</p>
          </section>

          <p className="px-1 text-center text-xs leading-relaxed text-muted-foreground">
            This is general education, not a diagnosis of what&apos;s causing your symptoms — your provider can
            evaluate your specific situation.
          </p>
        </div>
      ) : (
        <p className="px-1 text-center text-sm text-muted-foreground">Select an area above to see what&apos;s common.</p>
      )}
    </div>
  );
}
