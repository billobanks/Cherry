import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import type { PatternDisplay } from "@/lib/dashboard";

export function MyPatterns({ patterns }: { patterns: PatternDisplay[] }) {
  return (
    <div>
      <div className="flex items-center justify-between px-1">
        <h2 className="font-heading text-lg font-medium">My patterns</h2>
        <Link
          href="/patterns"
          className="flex items-center gap-1 text-sm font-medium text-primary transition-opacity hover:opacity-70"
        >
          See all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {patterns.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-border px-4 py-5 text-sm leading-relaxed text-muted-foreground">
          Keep logging your check-ins — patterns like symptoms that tend to repeat during this
          phase will start showing up here after a few cycles.
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {patterns.map((pattern) => (
            <div
              key={pattern.symptomKey}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3.5"
            >
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <p className="text-sm leading-relaxed text-foreground">
                You&apos;ve logged{" "}
                <span className="font-medium">{pattern.label.toLowerCase()}</span> during this
                phase in{" "}
                <span className="font-medium">
                  {pattern.occurrences} of your last {pattern.eligibleCycles}
                </span>{" "}
                cycles.
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
