export function PersonalizedInsightsCard({
  basedOnUserLogs,
  patterns,
}: {
  basedOnUserLogs: string[];
  patterns: string[];
}) {
  if (basedOnUserLogs.length === 0 && patterns.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-card px-5 py-5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Why you might be feeling this way</span>
      <div className="mt-2 flex flex-col gap-2.5">
        {basedOnUserLogs.map((sentence) => (
          <p key={sentence} className="text-[15px] leading-relaxed text-foreground">
            {sentence}
          </p>
        ))}
        {patterns.map((sentence) => (
          <p key={sentence} className="text-[15px] leading-relaxed text-muted-foreground">
            {sentence}
          </p>
        ))}
      </div>
    </section>
  );
}
