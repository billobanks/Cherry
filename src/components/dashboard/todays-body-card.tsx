import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { MOOD_OPTIONS } from "@/lib/checkin";
import type { TodaysBody } from "@/lib/dashboard";

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl bg-secondary/60 px-3 py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-[15px] font-semibold text-foreground">{value}</span>
    </div>
  );
}

export function TodaysBodyCard({ body }: { body: TodaysBody }) {
  const moodValue = body.mood.length
    ? body.mood.map((m) => MOOD_OPTIONS.find((o) => o.value === m)?.emoji).join(" ")
    : "—";
  const energyValue = body.energyLevel ? `${body.energyLevel}/5` : "—";
  const sleepValue = body.sleepQuality ? `${body.sleepQuality}/5` : "—";
  const cravingsValue = body.hasLoggedToday ? (body.hasCravings ? "Yes" : "No") : "—";

  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-5">
      <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-primary">
        Today&apos;s body
      </span>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Mood" value={moodValue} />
        <StatTile label="Energy" value={energyValue} />
        <StatTile label="Sleep" value={sleepValue} />
        <StatTile label="Cravings" value={cravingsValue} />
      </div>

      <Link
        href="/app/check-in"
        className="mt-4 flex h-12 w-full items-center justify-center gap-1.5 rounded-full bg-primary text-[15px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        {body.hasLoggedToday ? "Edit check-in" : "Quick check-in"}
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
