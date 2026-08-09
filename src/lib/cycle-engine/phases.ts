import {
  LUTEAL_PHASE_LENGTH_DAYS,
  MIN_PHASE_BUFFER_DAYS,
  OVULATION_WINDOW_RADIUS_DAYS,
} from "./constants";
import { addDays, formatISODate } from "./date-utils";
import type { CyclePhase, PhaseRange } from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Estimated ovulation day-of-cycle (1-indexed), anchored to the far more
 * consistent luteal phase: ovulation ≈ cycleLength - 14. Clamped so there's
 * always at least a couple of days of follicular phase before it and luteal
 * phase after it, even for cycle lengths near the edges of what's supported.
 */
export function estimateOvulationDayOfCycle(
  cycleLengthDays: number,
  periodLengthDays: number,
): number {
  const raw = cycleLengthDays - LUTEAL_PHASE_LENGTH_DAYS;
  const lowerBound = Math.min(
    periodLengthDays + MIN_PHASE_BUFFER_DAYS,
    cycleLengthDays - MIN_PHASE_BUFFER_DAYS,
  );
  const upperBound = cycleLengthDays - MIN_PHASE_BUFFER_DAYS;
  return Math.round(clamp(raw, Math.min(lowerBound, upperBound), upperBound));
}

export interface PhaseDayBoundaries {
  menstrual: [number, number];
  follicular: [number, number] | null;
  ovulationWindow: [number, number];
  luteal: [number, number] | null;
}

/** Day-of-cycle (1-indexed, inclusive) boundaries for all four phases. */
export function computePhaseDayBoundaries(
  cycleLengthDays: number,
  periodLengthDays: number,
): PhaseDayBoundaries {
  const ovulationDay = estimateOvulationDayOfCycle(cycleLengthDays, periodLengthDays);
  const windowStart = Math.max(
    periodLengthDays + 1,
    ovulationDay - OVULATION_WINDOW_RADIUS_DAYS,
  );
  const windowEnd = Math.min(
    cycleLengthDays,
    ovulationDay + OVULATION_WINDOW_RADIUS_DAYS,
  );

  const menstrual: [number, number] = [1, Math.min(periodLengthDays, cycleLengthDays)];
  const follicular: [number, number] | null =
    windowStart > menstrual[1] + 1 ? [menstrual[1] + 1, windowStart - 1] : null;
  const luteal: [number, number] | null =
    windowEnd < cycleLengthDays ? [windowEnd + 1, cycleLengthDays] : null;

  return { menstrual, follicular, ovulationWindow: [windowStart, windowEnd], luteal };
}

/** Which phase a given (possibly late, i.e. > cycleLengthDays) cycle day falls into. */
export function classifyCurrentPhase(
  currentCycleDay: number,
  boundaries: PhaseDayBoundaries,
): CyclePhase {
  const day = Math.min(currentCycleDay, boundaries.luteal?.[1] ?? boundaries.ovulationWindow[1]);

  if (day <= boundaries.menstrual[1]) return "menstrual";
  if (boundaries.follicular && day <= boundaries.follicular[1]) return "follicular";
  if (day <= boundaries.ovulationWindow[1]) return "ovulation_window";
  return "luteal";
}

/** Builds the four PhaseRange entries with concrete calendar dates for the current cycle. */
export function buildPhaseRanges(
  cycleStartEpochDay: number,
  boundaries: PhaseDayBoundaries,
): PhaseRange[] {
  const toRange = (phase: CyclePhase, [start, end]: [number, number]): PhaseRange => ({
    phase,
    startDayOfCycle: start,
    endDayOfCycle: end,
    startDate: formatISODate(addDays(cycleStartEpochDay, start - 1)),
    endDate: formatISODate(addDays(cycleStartEpochDay, end - 1)),
  });

  const ranges: PhaseRange[] = [toRange("menstrual", boundaries.menstrual)];
  if (boundaries.follicular) ranges.push(toRange("follicular", boundaries.follicular));
  ranges.push(toRange("ovulation_window", boundaries.ovulationWindow));
  if (boundaries.luteal) ranges.push(toRange("luteal", boundaries.luteal));

  return ranges;
}
