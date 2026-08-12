import Link from "next/link";
import type { MovementRecommendation, MovementType } from "@/lib/movement";
import { RecommendedMovementCard } from "./recommended-movement-card";
import { WorkoutPreferencesCard } from "./workout-preferences-card";

export function MovementView({
  recommendation,
  hasLoggedToday,
  workoutPreferences,
}: {
  recommendation: MovementRecommendation;
  hasLoggedToday: boolean;
  workoutPreferences: MovementType[];
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div>
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
          Movement
        </span>
        <h1 className="mt-2 font-heading text-3xl font-medium text-balance">
          What might feel good today
        </h1>
      </div>

      {!hasLoggedToday ? (
        <div className="rounded-2xl border border-dashed border-border px-4 py-3.5 text-sm text-muted-foreground">
          This is based on your estimated cycle phase alone.{" "}
          <Link href="/app/check-in" className="font-medium text-primary underline">
            Log today&apos;s check-in
          </Link>{" "}
          and we&apos;ll factor in your actual energy and symptoms.
        </div>
      ) : null}

      <RecommendedMovementCard recommendation={recommendation} />

      <WorkoutPreferencesCard initial={workoutPreferences} />

      <p className="px-1 text-center text-xs leading-relaxed text-muted-foreground">
        Not everyone responds to hormonal changes the same way — these are general starting
        points, not a training plan. Check with a doctor before starting a new exercise routine if
        you have any concerns.
      </p>
    </div>
  );
}
