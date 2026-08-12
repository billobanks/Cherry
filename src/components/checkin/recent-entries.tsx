import { NotebookPen } from "lucide-react";
import Link from "next/link";
import { FLOW_OPTIONS, MOOD_OPTIONS } from "@/lib/checkin";
import type { CheckinSummary } from "@/lib/checkin";

function relativeDateLabel(dateISO: string, todayISO: string): string {
  if (dateISO === todayISO) return "Today";

  const date = new Date(`${dateISO}T00:00:00Z`);
  const today = new Date(`${todayISO}T00:00:00Z`);
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((today.getTime() - date.getTime()) / dayMs);

  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

export function RecentEntries({
  entries,
  todayISO,
}: {
  entries: CheckinSummary[];
  todayISO: string;
}) {
  if (entries.length === 0) {
    return (
      <p className="px-5 text-sm text-muted-foreground sm:px-8">
        Your logged check-ins will show up here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-5 sm:px-8">
      {entries.map((entry) => {
        const flowLabel = FLOW_OPTIONS.find((f) => f.value === entry.flow)?.label;
        const moodEmojis = entry.mood
          .map((m) => MOOD_OPTIONS.find((o) => o.value === m)?.emoji)
          .filter(Boolean);

        return (
          <Link
            key={entry.checkinDate}
            href={`/app/check-in?date=${entry.checkinDate}`}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40"
          >
            <span className="w-16 shrink-0 text-sm font-semibold">
              {relativeDateLabel(entry.checkinDate, todayISO)}
            </span>

            <span className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {flowLabel && flowLabel !== "None" ? (
                <span className="text-foreground">{flowLabel} flow</span>
              ) : null}
              {moodEmojis.length > 0 ? <span aria-hidden>{moodEmojis.join(" ")}</span> : null}
              {entry.energyLevel ? <span>Energy {entry.energyLevel}/5</span> : null}
              {entry.sleepQuality ? <span>Sleep {entry.sleepQuality}/5</span> : null}
              {entry.symptomCount > 0 ? (
                <span>
                  {entry.symptomCount} symptom{entry.symptomCount === 1 ? "" : "s"}
                </span>
              ) : null}
              {!flowLabel &&
              moodEmojis.length === 0 &&
              !entry.energyLevel &&
              !entry.sleepQuality &&
              entry.symptomCount === 0 ? (
                <span>Logged</span>
              ) : null}
            </span>

            {entry.hasNotes ? (
              <NotebookPen className="h-4 w-4 shrink-0 text-muted-foreground" aria-label="Has notes" />
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
