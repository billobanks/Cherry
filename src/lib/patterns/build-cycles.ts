import { diffDays, parseISODate } from "@/lib/cycle-engine";
import type { HistoricalCycle } from "./types";

export interface CycleRow {
  start_date: string;
  period_length_days: number | null;
}

/**
 * Turns raw `cycles` table rows (sorted ascending) into the completed-cycle
 * inputs the pattern analyzers expect: consecutive start dates pair up into
 * real cycle lengths, and the last row — the current, still-open cycle — is
 * always excluded, since its length isn't known yet.
 */
export function buildCompletedCycles(
  rows: CycleRow[],
  fallbackPeriodLengthDays: number | null,
  defaultPeriodLengthDays: number,
): HistoricalCycle[] {
  const completedCycles: HistoricalCycle[] = [];
  for (let i = 0; i < rows.length - 1; i++) {
    const cycleLengthDays = diffDays(
      parseISODate(rows[i + 1].start_date),
      parseISODate(rows[i].start_date),
    );
    completedCycles.push({
      startDate: rows[i].start_date,
      cycleLengthDays,
      periodLengthDays:
        rows[i].period_length_days ?? fallbackPeriodLengthDays ?? defaultPeriodLengthDays,
    });
  }
  return completedCycles;
}
