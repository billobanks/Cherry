"use client";

import { ChevronDown, type LucideIcon } from "lucide-react";
import { useState } from "react";
import type { InsightFeedbackResponse, InsightSection } from "@/lib/insights";
import { FeedbackControl } from "./feedback-control";

export function SectionCard({
  section,
  icon: Icon,
  response,
  onRespond,
}: {
  section: InsightSection;
  icon: LucideIcon;
  response: InsightFeedbackResponse | null;
  onRespond: (response: InsightFeedbackResponse) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasAnswered = response != null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-4 py-4 text-left"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <span className="flex-1 text-[15px] font-medium leading-snug">{section.title}</span>
        {section.previouslyResonated ? (
          <>
            <span className="hidden shrink-0 rounded-full bg-moss-soft px-2.5 py-0.5 text-xs font-medium text-moss sm:inline-block">
              Matched before
            </span>
            {!hasAnswered ? (
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-moss sm:hidden"
                aria-hidden
                title="Matched before"
              />
            ) : null}
          </>
        ) : null}
        {hasAnswered && !expanded ? (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
        ) : null}
        <ChevronDown
          className={`h-4.5 w-4.5 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded ? (
        <div className="px-4 pb-4">
          <p className="text-[15px] leading-relaxed text-foreground">{section.summary}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {section.points.map((point, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <FeedbackControl value={response} onRespond={onRespond} />
        </div>
      ) : null}
    </div>
  );
}
