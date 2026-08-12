import type { ContractionIntensity } from "@/types/database";

export interface ContractionRecord {
  id: string;
  startedAt: string;
  endedAt: string | null;
  intensity: ContractionIntensity | null;
}

export interface ContractionWithStats extends ContractionRecord {
  durationSeconds: number | null;
  /** Seconds since the previous contraction started — null for the earliest one in the list. */
  intervalSinceLastSeconds: number | null;
}

/**
 * Pure: duration and interval are computed here, not stored, since
 * `ended_at` can be added after the fact and stored durations would drift
 * out of sync. Input must be sorted oldest-first for interval math to be
 * meaningful.
 */
export function computeContractionStats(contractions: ContractionRecord[]): ContractionWithStats[] {
  return contractions.map((contraction, index) => {
    const startedAtMs = new Date(contraction.startedAt).getTime();
    const durationSeconds = contraction.endedAt
      ? Math.round((new Date(contraction.endedAt).getTime() - startedAtMs) / 1000)
      : null;

    const previous = index > 0 ? contractions[index - 1] : null;
    const intervalSinceLastSeconds = previous
      ? Math.round((startedAtMs - new Date(previous.startedAt).getTime()) / 1000)
      : null;

    return { ...contraction, durationSeconds, intervalSinceLastSeconds };
  });
}
