"use client";

import { useState } from "react";
import { PHASE_LABELS, type CyclePhase } from "@/lib/cycle-engine";
import { PHASE_SECTION_CONTENT, SECTION_ORDER, SECTION_TITLES } from "@/lib/insights";
import type { ContentArticleSummary } from "@/lib/repository/content";

const PHASES: CyclePhase[] = ["menstrual", "follicular", "ovulation_window", "luteal"];

export function LearnView({
  initialPhase,
  articles,
}: {
  initialPhase: CyclePhase | null;
  articles: ContentArticleSummary[];
}) {
  const [phase, setPhase] = useState<CyclePhase>(initialPhase ?? "menstrual");
  const content = PHASE_SECTION_CONTENT[phase];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Learn</span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">What to know, phase by phase</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          General education about each part of the cycle, any time you want to read it — not just today&apos;s.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {PHASES.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPhase(p)}
            aria-pressed={phase === p}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              phase === p
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary/40"
            }`}
          >
            {PHASE_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {SECTION_ORDER.map((key) => {
          const section = content[key];
          return (
            <section key={key} className="rounded-2xl border border-border bg-card px-5 py-5">
              <h2 className="text-[15px] font-medium text-foreground">{SECTION_TITLES[key]}</h2>
              <p className="mt-1.5 text-[15px] leading-relaxed text-foreground">{section.summary}</p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {section.points.map((point) => (
                  <li key={point} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                    <span className="text-primary" aria-hidden>
                      •
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {articles.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-medium">More from Cherry</h2>
          <ul className="flex flex-col gap-2">
            {articles.map((article) => (
              <li key={article.slug} className="rounded-2xl border border-border bg-card px-5 py-4">
                <p className="text-[15px] font-medium text-foreground">{article.title}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
