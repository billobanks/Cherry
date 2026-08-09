import { formatDaysFromNow, type UpcomingChange } from "@/lib/dashboard";

export function NextFewDays({ changes }: { changes: UpcomingChange[] }) {
  if (changes.length === 0) return null;

  return (
    <div>
      <h2 className="px-1 font-heading text-lg font-medium">Next few days</h2>
      <div className="mt-3 flex flex-col gap-2">
        {changes.map((change) => (
          <div
            key={change.label}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
          >
            <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 font-mono text-xs font-semibold text-accent-foreground">
              {formatDaysFromNow(change.daysFromNow)}
            </span>
            <span className="text-sm text-foreground">{change.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
