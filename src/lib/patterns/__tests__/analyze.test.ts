import { describe, expect, it } from "vitest";
import { analyzeSymptomPatterns } from "../analyze";
import type { HistoricalCycle } from "../types";

// Four consecutive 28-day, 5-day-period cycles. Luteal phase (days 17-28)
// for each: [Jan17-Jan28], [Feb14-Feb25], [Mar14-Mar25], [Apr11-Apr22].
const FOUR_CYCLES: HistoricalCycle[] = [
  { startDate: "2026-01-01", cycleLengthDays: 28, periodLengthDays: 5 },
  { startDate: "2026-01-29", cycleLengthDays: 28, periodLengthDays: 5 },
  { startDate: "2026-02-26", cycleLengthDays: 28, periodLengthDays: 5 },
  { startDate: "2026-03-26", cycleLengthDays: 28, periodLengthDays: 5 },
];

describe("analyzeSymptomPatterns", () => {
  it("matches the headline example: a symptom logged during the phase in 3 of the last 4 cycles", () => {
    const patterns = analyzeSymptomPatterns({
      currentPhase: "luteal",
      completedCycles: FOUR_CYCLES,
      symptomLogs: [
        { date: "2026-01-20", symptomKey: "headache" }, // cycle 1 luteal
        { date: "2026-02-18", symptomKey: "headache" }, // cycle 2 luteal
        { date: "2026-03-20", symptomKey: "headache" }, // cycle 3 luteal
        // no headache log in cycle 4's luteal window
      ],
    });

    expect(patterns).toEqual([{ symptomKey: "headache", occurrences: 3, eligibleCycles: 4 }]);
  });

  it("ignores a symptom logged outside the phase's date range", () => {
    const patterns = analyzeSymptomPatterns({
      currentPhase: "luteal",
      completedCycles: FOUR_CYCLES,
      symptomLogs: [
        { date: "2026-01-03", symptomKey: "cramps" }, // cycle 1, but menstrual phase, not luteal
        { date: "2026-02-01", symptomKey: "cramps" }, // cycle 2, follicular phase
      ],
    });
    expect(patterns).toEqual([]);
  });

  it("requires at least 2 occurrences even with enough eligible cycles", () => {
    const patterns = analyzeSymptomPatterns({
      currentPhase: "luteal",
      completedCycles: FOUR_CYCLES,
      symptomLogs: [{ date: "2026-01-20", symptomKey: "nausea" }],
    });
    expect(patterns).toEqual([]);
  });

  it("requires at least 2 eligible cycles even with a matching symptom", () => {
    const patterns = analyzeSymptomPatterns({
      currentPhase: "luteal",
      completedCycles: [FOUR_CYCLES[0]],
      symptomLogs: [{ date: "2026-01-20", symptomKey: "headache" }],
    });
    expect(patterns).toEqual([]);
  });

  it("returns nothing with no history at all", () => {
    expect(
      analyzeSymptomPatterns({ currentPhase: "luteal", completedCycles: [], symptomLogs: [] }),
    ).toEqual([]);
  });

  it("only counts one occurrence per cycle even with multiple logs in the same window", () => {
    const patterns = analyzeSymptomPatterns({
      currentPhase: "luteal",
      completedCycles: FOUR_CYCLES,
      symptomLogs: [
        { date: "2026-01-18", symptomKey: "bloating" },
        { date: "2026-01-22", symptomKey: "bloating" }, // same cycle-1 luteal window, shouldn't double count
        { date: "2026-02-16", symptomKey: "bloating" },
      ],
    });
    expect(patterns).toEqual([{ symptomKey: "bloating", occurrences: 2, eligibleCycles: 4 }]);
  });

  it("sorts multiple qualifying symptoms by strength of the pattern (occurrence ratio)", () => {
    const patterns = analyzeSymptomPatterns({
      currentPhase: "luteal",
      completedCycles: FOUR_CYCLES,
      symptomLogs: [
        // headache: 2 of 4
        { date: "2026-01-20", symptomKey: "headache" },
        { date: "2026-02-18", symptomKey: "headache" },
        // fatigue: 3 of 4 — stronger pattern, should sort first
        { date: "2026-01-20", symptomKey: "fatigue" },
        { date: "2026-02-18", symptomKey: "fatigue" },
        { date: "2026-03-20", symptomKey: "fatigue" },
      ],
    });

    expect(patterns.map((p) => p.symptomKey)).toEqual(["fatigue", "headache"]);
  });

  it("only evaluates cycles whose shape actually produces the requested phase", () => {
    // A pathological cycle where the luteal boundary collapses (see phases.ts
    // clamp behavior for very short cycles / long periods) shouldn't count
    // as an eligible cycle for a luteal-phase pattern.
    const oddCycles: HistoricalCycle[] = [
      ...FOUR_CYCLES,
      { startDate: "2026-05-01", cycleLengthDays: 15, periodLengthDays: 14 },
    ];
    const patterns = analyzeSymptomPatterns({
      currentPhase: "luteal",
      completedCycles: oddCycles,
      symptomLogs: [
        { date: "2026-01-20", symptomKey: "headache" },
        { date: "2026-02-18", symptomKey: "headache" },
      ],
    });
    // Still only 4 eligible cycles (the 5th's luteal boundary is null), so the ratio is unaffected.
    expect(patterns).toEqual([{ symptomKey: "headache", occurrences: 2, eligibleCycles: 4 }]);
  });
});
