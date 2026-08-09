import { PHASE_LABELS, diffDays, parseISODate, type ISODateString, type PhaseRange } from "@/lib/cycle-engine";

export interface UpcomingChange {
  daysFromNow: number;
  label: string;
  date: ISODateString;
}

const DEFAULT_LOOKAHEAD_DAYS = 7;

/**
 * Scans the current cycle's phase boundaries (and the next-period estimate)
 * for anything about to happen within the lookahead window — used for the
 * "Next Few Days" section. Pure: takes today and the already-computed cycle
 * data, does no date math against the real clock.
 */
export function computeUpcomingChanges(params: {
  today: ISODateString;
  currentCycleDay: number;
  phases: PhaseRange[];
  nextPeriodDate: ISODateString;
  lookaheadDays?: number;
}): UpcomingChange[] {
  const { today, currentCycleDay, phases, nextPeriodDate } = params;
  const lookaheadDays = params.lookaheadDays ?? DEFAULT_LOOKAHEAD_DAYS;
  const todayEpoch = parseISODate(today);
  const changes: UpcomingChange[] = [];

  for (const phase of phases) {
    if (phase.startDayOfCycle <= currentCycleDay) continue; // already started or in progress
    const daysFromNow = phase.startDayOfCycle - currentCycleDay;
    if (daysFromNow > lookaheadDays) continue;
    changes.push({
      daysFromNow,
      label: `${PHASE_LABELS[phase.phase]} begins`,
      date: phase.startDate,
    });
  }

  const daysUntilPeriod = diffDays(parseISODate(nextPeriodDate), todayEpoch);
  if (daysUntilPeriod > 0 && daysUntilPeriod <= lookaheadDays) {
    changes.push({
      daysFromNow: daysUntilPeriod,
      label: "Next period estimated",
      date: nextPeriodDate,
    });
  }

  return changes.sort((a, b) => a.daysFromNow - b.daysFromNow);
}

export function formatDaysFromNow(daysFromNow: number): string {
  if (daysFromNow === 1) return "Tomorrow";
  return `In ${daysFromNow} days`;
}
