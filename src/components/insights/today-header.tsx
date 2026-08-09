export function TodayHeader({
  cycleDay,
  phaseLabel,
  date,
}: {
  cycleDay: number;
  phaseLabel: string;
  date: string;
}) {
  const formatted = new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <div>
      <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
        Today · {formatted}
      </span>
      <h1 className="mt-2 font-heading text-4xl font-medium text-balance">
        Cycle Day <span className="tabular-nums">{cycleDay}</span>
      </h1>
      <p className="mt-1 text-lg text-muted-foreground">{phaseLabel}</p>
    </div>
  );
}
