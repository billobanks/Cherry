import type { PatternSentence } from "@/lib/pregnancy/patterns-engine";

export function PregnancyPatternsView({ patterns, hasAnyData }: { patterns: PatternSentence[]; hasAnyData: boolean }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">Patterns</span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">My pregnancy patterns</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          Built from what you&apos;ve actually logged — never a diagnosis, just what the data shows.
        </p>
      </div>

      {patterns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-5 py-8 text-center">
          <p className="text-[15px] text-muted-foreground">
            {hasAnyData
              ? "Keep logging daily check-ins — patterns show up once there's enough history to compare."
              : "Log a few daily check-ins to start seeing your patterns here."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {patterns.map((pattern) => (
            <div key={pattern.key} className="rounded-2xl border border-border bg-card px-5 py-4">
              <p className="text-[15px] leading-relaxed text-foreground">{pattern.sentence}</p>
            </div>
          ))}
        </div>
      )}

      <p className="px-1 text-center text-xs leading-relaxed text-muted-foreground">
        These are observations about what you&apos;ve logged, not medical conclusions — bring anything that
        concerns you to your provider.
      </p>
    </div>
  );
}
