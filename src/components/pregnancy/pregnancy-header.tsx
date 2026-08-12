const TRIMESTER_LABELS = { first: "First trimester", second: "Second trimester", third: "Third trimester" };

function formatDueDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, { month: "long", day: "numeric", timeZone: "UTC" });
}

export function PregnancyHeader({
  displayName,
  gestationalAgeWeeks,
  gestationalAgeDays,
  trimester,
  estimatedDueDate,
  percentComplete,
}: {
  displayName: string | null;
  gestationalAgeWeeks: number;
  gestationalAgeDays: number;
  trimester: "first" | "second" | "third";
  estimatedDueDate: string;
  percentComplete: number;
}) {
  const hour = new Date().getUTCHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="bg-gradient-to-b from-accent/50 to-transparent px-5 pt-8 pb-6 text-center sm:px-8">
      <p className="font-heading text-xl font-medium">
        {greeting}
        {displayName ? `, ${displayName}` : ""}
      </p>

      <p className="mt-4 font-heading text-4xl font-medium tabular-nums">
        {gestationalAgeWeeks} Weeks + {gestationalAgeDays} Days
      </p>
      <span className="mt-2 inline-block rounded-full bg-primary px-3 py-1 font-mono text-xs font-semibold uppercase tracking-widest text-primary-foreground">
        {TRIMESTER_LABELS[trimester]}
      </span>

      <div className="mx-auto mt-5 max-w-xs">
        <p className="text-xs text-muted-foreground">Estimated Due Date</p>
        <p className="font-heading text-lg font-medium">{formatDueDate(estimatedDueDate)}</p>
      </div>

      <div className="mx-auto mt-4 max-w-xs">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Your pregnancy</span>
          <span className="tabular-nums">{percentComplete}% complete</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percentComplete}%` }} />
        </div>
      </div>
    </div>
  );
}
