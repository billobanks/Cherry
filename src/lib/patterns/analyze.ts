import {
  addDays,
  computePhaseDayBoundaries,
  parseISODate,
  type CyclePhase,
  type PhaseDayBoundaries,
} from "@/lib/cycle-engine";
import type { HistoricalCycle, SymptomLogEntry, SymptomPattern } from "./types";

const MIN_ELIGIBLE_CYCLES = 2;
const MIN_OCCURRENCES = 2;

function phaseDayRange(boundaries: PhaseDayBoundaries, phase: CyclePhase): [number, number] | null {
  switch (phase) {
    case "menstrual":
      return boundaries.menstrual;
    case "follicular":
      return boundaries.follicular;
    case "ovulation_window":
      return boundaries.ovulationWindow;
    case "luteal":
      return boundaries.luteal;
  }
}

/**
 * Finds symptoms that recur during a given phase across past cycles — the
 * "you've logged headaches during this phase in 3 of your last 4 cycles"
 * signal. Pure: `completedCycles` must already be *past, finished* cycles
 * (real cycleLengthDays, not the current in-progress one), which is the
 * caller's responsibility to filter for.
 */
export function analyzeSymptomPatterns(params: {
  currentPhase: CyclePhase;
  completedCycles: HistoricalCycle[];
  symptomLogs: SymptomLogEntry[];
}): SymptomPattern[] {
  const { currentPhase, completedCycles, symptomLogs } = params;

  const logDaysByKey = new Map<string, number[]>();
  for (const log of symptomLogs) {
    const day = parseISODate(log.date);
    const days = logDaysByKey.get(log.symptomKey);
    if (days) {
      days.push(day);
    } else {
      logDaysByKey.set(log.symptomKey, [day]);
    }
  }

  let eligibleCycles = 0;
  const occurrenceCounts = new Map<string, number>();

  for (const cycle of completedCycles) {
    const boundaries = computePhaseDayBoundaries(cycle.cycleLengthDays, cycle.periodLengthDays);
    const range = phaseDayRange(boundaries, currentPhase);
    if (!range) continue; // this cycle's shape didn't produce this phase (extreme edge case)
    eligibleCycles++;

    const cycleStart = parseISODate(cycle.startDate);
    const rangeStart = addDays(cycleStart, range[0] - 1);
    const rangeEnd = addDays(cycleStart, range[1] - 1);

    for (const [symptomKey, days] of logDaysByKey) {
      const loggedDuringThisPhase = days.some((d) => d >= rangeStart && d <= rangeEnd);
      if (loggedDuringThisPhase) {
        occurrenceCounts.set(symptomKey, (occurrenceCounts.get(symptomKey) ?? 0) + 1);
      }
    }
  }

  if (eligibleCycles < MIN_ELIGIBLE_CYCLES) return [];

  const patterns: SymptomPattern[] = [];
  for (const [symptomKey, occurrences] of occurrenceCounts) {
    if (occurrences >= MIN_OCCURRENCES) {
      patterns.push({ symptomKey, occurrences, eligibleCycles });
    }
  }

  patterns.sort((a, b) => {
    const ratioDiff = b.occurrences / b.eligibleCycles - a.occurrences / a.eligibleCycles;
    return ratioDiff !== 0 ? ratioDiff : b.occurrences - a.occurrences;
  });

  return patterns;
}
