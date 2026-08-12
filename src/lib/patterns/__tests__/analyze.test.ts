import { describe, expect, it } from "vitest";
import { addDays, formatISODate, parseISODate } from "@/lib/cycle-engine";
import {
  analyzeCycleLengthTrend,
  analyzeEnergyPatterns,
  analyzeMostCommonSymptoms,
  analyzePeriodDurationTrend,
  analyzeSleepPatterns,
  analyzeSymptomPatterns,
  analyzeTaggedPatternsAllPhases,
  buildCycleDayProfile,
} from "../analyze";
import type { DailyMetricEntry, HistoricalCycle } from "../types";

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

describe("analyzeTaggedPatternsAllPhases", () => {
  it("finds patterns across every phase in one pass, not just one", () => {
    const results = analyzeTaggedPatternsAllPhases(FOUR_CYCLES, [
      // headache in luteal (Jan17-28, Feb14-25, Mar14-25) — 3 of 4 cycles
      { date: "2026-01-20", key: "headache" },
      { date: "2026-02-18", key: "headache" },
      { date: "2026-03-20", key: "headache" },
      // happy in follicular (Jan6-16, Feb3-13, Mar3-13, Mar31-Apr10) — 2 of 4 cycles
      { date: "2026-01-10", key: "happy" },
      { date: "2026-02-08", key: "happy" },
    ]);

    expect(results).toContainEqual({
      key: "headache",
      phase: "luteal",
      occurrences: 3,
      eligibleCycles: 4,
    });
    expect(results).toContainEqual({
      key: "happy",
      phase: "follicular",
      occurrences: 2,
      eligibleCycles: 4,
    });
  });

  it("returns nothing when no key clears the occurrence threshold in any phase", () => {
    const results = analyzeTaggedPatternsAllPhases(FOUR_CYCLES, [
      { date: "2026-01-20", key: "headache" },
    ]);
    expect(results).toEqual([]);
  });

  it("sorts by pattern strength (occurrence ratio) across all phases together", () => {
    const results = analyzeTaggedPatternsAllPhases(FOUR_CYCLES, [
      { date: "2026-01-20", key: "weak" },
      { date: "2026-02-18", key: "weak" },
      { date: "2026-01-20", key: "strong" },
      { date: "2026-02-18", key: "strong" },
      { date: "2026-03-20", key: "strong" },
    ]);
    expect(results[0].key).toBe("strong");
  });
});

describe("analyzeCycleLengthTrend", () => {
  const cycles: HistoricalCycle[] = [
    { startDate: "2026-04-01", cycleLengthDays: 28, periodLengthDays: 5 },
    { startDate: "2026-05-01", cycleLengthDays: 29, periodLengthDays: 5 },
    { startDate: "2026-06-01", cycleLengthDays: 30, periodLengthDays: 5 },
  ];

  it("matches the headline example: a 6-month average of 29 days", () => {
    const trend = analyzeCycleLengthTrend(cycles, "2026-08-08");
    expect(trend).toEqual({
      averageDays: 29,
      cycleCount: 3,
      dataPoints: [
        { startDate: "2026-04-01", lengthDays: 28 },
        { startDate: "2026-05-01", lengthDays: 29 },
        { startDate: "2026-06-01", lengthDays: 30 },
      ],
    });
  });

  it("returns null with fewer than 2 cycles", () => {
    expect(analyzeCycleLengthTrend([cycles[0]], "2026-08-08")).toBeNull();
    expect(analyzeCycleLengthTrend([], "2026-08-08")).toBeNull();
  });

  it("excludes cycles outside the lookback window", () => {
    const oldCycle: HistoricalCycle = {
      startDate: "2024-01-01",
      cycleLengthDays: 45,
      periodLengthDays: 5,
    };
    const trend = analyzeCycleLengthTrend([oldCycle, ...cycles], "2026-08-08", 183);
    expect(trend?.cycleCount).toBe(3);
    expect(trend?.dataPoints.some((d) => d.startDate === "2024-01-01")).toBe(false);
  });
});

describe("analyzePeriodDurationTrend", () => {
  it("counts actually-logged period days per cycle, not the stored estimate", () => {
    const cycles: HistoricalCycle[] = [
      { startDate: "2026-06-01", cycleLengthDays: 30, periodLengthDays: 5 },
      { startDate: "2026-07-01", cycleLengthDays: 28, periodLengthDays: 5 },
    ];
    const periodLogDates = [
      "2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04", "2026-06-05",
      "2026-07-01", "2026-07-02", "2026-07-03", "2026-07-04",
    ];

    const trend = analyzePeriodDurationTrend(cycles, periodLogDates, "2026-08-08");
    expect(trend).toEqual({
      averageDays: 4.5,
      cycleCount: 2,
      dataPoints: [
        { startDate: "2026-06-01", durationDays: 5 },
        { startDate: "2026-07-01", durationDays: 4 },
      ],
    });
  });

  it("excludes a cycle with no logged period days at all — an estimate isn't a data point", () => {
    const cycles: HistoricalCycle[] = [
      { startDate: "2026-06-01", cycleLengthDays: 30, periodLengthDays: 5 },
      { startDate: "2026-07-01", cycleLengthDays: 28, periodLengthDays: 5 },
    ];
    const trend = analyzePeriodDurationTrend(cycles, ["2026-06-01", "2026-06-02"], "2026-08-08");
    expect(trend).toBeNull(); // only 1 cycle has any logged days, below the 2-cycle minimum
  });
});

describe("analyzeMostCommonSymptoms", () => {
  it("ranks symptoms by frequency and drops anything below the threshold", () => {
    const logs = [
      { date: "2026-01-01", symptomKey: "headache" },
      { date: "2026-02-01", symptomKey: "headache" },
      { date: "2026-03-01", symptomKey: "headache" },
      { date: "2026-01-01", symptomKey: "cramps" },
      { date: "2026-02-01", symptomKey: "cramps" },
      { date: "2026-01-01", symptomKey: "bloating" }, // only once — below default threshold of 2
    ];
    expect(analyzeMostCommonSymptoms(logs)).toEqual([
      { key: "headache", count: 3 },
      { key: "cramps", count: 2 },
    ]);
  });
});

const FOUR_28DAY_STARTS = ["2026-01-01", "2026-01-29", "2026-02-26", "2026-03-26"];
const FOUR_28DAY_CYCLES: HistoricalCycle[] = FOUR_28DAY_STARTS.map((startDate) => ({
  startDate,
  cycleLengthDays: 28,
  periodLengthDays: 5,
}));

function buildCycleEntries(
  startDate: string,
  cycleLengthDays: number,
  valueForDay: (dayNumber: number) => number,
): DailyMetricEntry[] {
  const start = parseISODate(startDate);
  const entries: DailyMetricEntry[] = [];
  for (let d = 0; d < cycleLengthDays; d++) {
    entries.push({ date: formatISODate(addDays(start, d)), value: valueForDay(d + 1) });
  }
  return entries;
}

// Day 26-27 (2-3 days before a 28-day period) dips; days 8-13 rise; everything else is flat.
function patternedEnergyForDay(day: number): number {
  if (day === 26 || day === 27) return 2;
  if (day >= 8 && day <= 13) return 4;
  return 3;
}

const PATTERNED_ENTRIES: DailyMetricEntry[] = FOUR_28DAY_STARTS.flatMap((start) =>
  buildCycleEntries(start, 28, patternedEnergyForDay),
);

describe("buildCycleDayProfile", () => {
  it("pools values by absolute cycle-day-number across cycles", () => {
    const profile = buildCycleDayProfile(FOUR_28DAY_CYCLES, PATTERNED_ENTRIES);
    const day10 = profile.find((p) => p.cycleDay === 10);
    expect(day10).toEqual({ cycleDay: 10, average: 4, sampleSize: 4 });
  });
});

describe("analyzeEnergyPatterns", () => {
  it("matches both headline examples: a pre-period dip and a mid-cycle rise", () => {
    const { patterns } = analyzeEnergyPatterns(FOUR_28DAY_CYCLES, PATTERNED_ENTRIES);

    expect(patterns).toContainEqual(
      expect.objectContaining({
        windowLabel: "2-3 days before your period",
        direction: "lower",
        sentence: "You've tended to feel a bit more tired 2-3 days before your period.",
        cycleCount: 4,
      }),
    );
    expect(patterns).toContainEqual(
      expect.objectContaining({
        windowLabel: "days 8-13",
        direction: "higher",
        sentence: "Your energy has often felt a little brighter around days 8-13.",
        cycleCount: 4,
      }),
    );
  });

  it("reports no patterns when energy is flat across the cycle", () => {
    const flatEntries = FOUR_28DAY_STARTS.flatMap((start) => buildCycleEntries(start, 28, () => 3));
    const { patterns } = analyzeEnergyPatterns(FOUR_28DAY_CYCLES, flatEntries);
    expect(patterns).toEqual([]);
  });

  it("reports no patterns with fewer than 3 cycles of data, even if the difference is real", () => {
    const twoCycles = FOUR_28DAY_CYCLES.slice(0, 2);
    const twoCyclesEntries = FOUR_28DAY_STARTS.slice(0, 2).flatMap((start) =>
      buildCycleEntries(start, 28, patternedEnergyForDay),
    );
    const { patterns } = analyzeEnergyPatterns(twoCycles, twoCyclesEntries);
    expect(patterns).toEqual([]);
  });

  it("always returns a full day-of-cycle profile for charting, regardless of detected patterns", () => {
    const flatEntries = FOUR_28DAY_STARTS.flatMap((start) => buildCycleEntries(start, 28, () => 3));
    const { profile } = analyzeEnergyPatterns(FOUR_28DAY_CYCLES, flatEntries);
    expect(profile).toHaveLength(28);
  });
});

describe("analyzeSleepPatterns", () => {
  it("uses sleep-specific wording for the same window logic", () => {
    const { patterns } = analyzeSleepPatterns(FOUR_28DAY_CYCLES, PATTERNED_ENTRIES);
    expect(patterns.some((p) => p.sentence.toLowerCase().includes("sleep"))).toBe(true);
    expect(patterns.some((p) => /rougher/i.test(p.sentence))).toBe(true);
  });
});
