import {
  addDays,
  computePhaseDayBoundaries,
  formatISODate,
  parseISODate,
  type CyclePhase,
  type ISODateString,
  type PhaseDayBoundaries,
} from "@/lib/cycle-engine";

export interface CalendarDayEstimate {
  date: ISODateString;
  /** 1-indexed day within its cycle instance. */
  cycleDay: number;
  phase: CyclePhase;
  /**
   * True when this day belongs to a cycle instance whose *start* is itself
   * projected rather than a real logged date — i.e. the whole cycle is a
   * forecast, not just the phase estimate within a known cycle. This is
   * what the calendar uses to tell a predicted period day from a logged one
   * (combined with whatever the user actually logged for that date).
   */
  isProjectedCycle: boolean;
}

function phaseEntries(boundaries: PhaseDayBoundaries): [CyclePhase, [number, number]][] {
  const entries: [CyclePhase, [number, number]][] = [["menstrual", boundaries.menstrual]];
  if (boundaries.follicular) entries.push(["follicular", boundaries.follicular]);
  entries.push(["ovulation_window", boundaries.ovulationWindow]);
  if (boundaries.luteal) entries.push(["luteal", boundaries.luteal]);
  return entries;
}

/**
 * Assigns a phase (and cycle day) to every day in [rangeStart, rangeEnd],
 * built cycle-by-cycle from known logged period-start dates: real gaps
 * between known starts give a cycle's actual length; beyond the last known
 * start, cycles are projected forward using `effectiveCycleLengthDays`.
 * Days before the earliest known start are left out entirely — there's
 * nothing to ground a phase estimate in before any logged history.
 */
export function buildCalendarDayEstimates(params: {
  /** Sorted ascending, real logged cycle start dates. */
  historicalStartDates: ISODateString[];
  effectiveCycleLengthDays: number;
  effectivePeriodLengthDays: number;
  rangeStart: ISODateString;
  rangeEnd: ISODateString;
}): CalendarDayEstimate[] {
  const { historicalStartDates, effectiveCycleLengthDays, effectivePeriodLengthDays } = params;
  if (historicalStartDates.length === 0) return [];

  const rangeStartDay = parseISODate(params.rangeStart);
  const rangeEndDay = parseISODate(params.rangeEnd);

  const knownStarts = historicalStartDates.map(parseISODate);
  const starts = [...knownStarts];
  while (starts[starts.length - 1] < rangeEndDay) {
    starts.push(addDays(starts[starts.length - 1], effectiveCycleLengthDays));
  }

  const results: CalendarDayEstimate[] = [];

  for (let i = 0; i < starts.length; i++) {
    const cycleStart = starts[i];
    if (cycleStart > rangeEndDay) break;

    const isProjectedCycle = i >= knownStarts.length;
    const nextStart = i + 1 < starts.length ? starts[i + 1] : addDays(cycleStart, effectiveCycleLengthDays);
    const cycleLengthDays = nextStart - cycleStart;
    if (nextStart <= rangeStartDay) continue;

    const boundaries = computePhaseDayBoundaries(cycleLengthDays, effectivePeriodLengthDays);

    for (const [phase, [start, end]] of phaseEntries(boundaries)) {
      for (let day = start; day <= end; day++) {
        const date = addDays(cycleStart, day - 1);
        if (date < rangeStartDay || date > rangeEndDay) continue;
        results.push({ date: formatISODate(date), cycleDay: day, phase, isProjectedCycle });
      }
    }
  }

  results.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return results;
}
