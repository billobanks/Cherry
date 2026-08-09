import { describe, expect, it } from "vitest";
import { addDays, formatISODate, parseISODate, todayEpochDays } from "../date-utils";
import { CYCLE_DISCLAIMERS } from "../disclaimers";
import { CycleInputError, calculateCycleInsights } from "../engine";
import { PHASE_LABELS } from "../labels";
import type { ConfidenceLevel, ISODateString } from "../types";

const RANK: Record<ConfidenceLevel, number> = { low: 0, moderate: 1, high: 2 };

/** Generates `count` period start dates, `cycleLength` days apart, ending exactly on `lastDate`. */
function buildRegularHistory(
  lastDate: ISODateString,
  cycleLength: number,
  count: number,
): ISODateString[] {
  const lastEpoch = parseISODate(lastDate);
  const dates: ISODateString[] = [];
  for (let i = 1; i < count; i++) {
    dates.push(formatISODate(addDays(lastEpoch, -cycleLength * i)));
  }
  return dates;
}

describe("calculateCycleInsights — 28-day cycles", () => {
  it("computes a mid-cycle day and follicular phase from a manual average, no history", () => {
    const start = "2026-03-01";
    const today = formatISODate(addDays(parseISODate(start), 10)); // day 11

    const result = calculateCycleInsights({
      mostRecentPeriodStartDate: start,
      historicalPeriodStartDates: [],
      averageCycleLengthDays: 28,
      averagePeriodDurationDays: 5,
      cycleVariability: "regular",
      today,
    });

    expect(result.currentCycleDay).toBe(11);
    expect(result.currentPhase).toBe("follicular");
    expect(result.effectiveCycleLengthDays).toBe(28);
    expect(result.dataSource.cycleLength).toBe("manual");
    expect(result.estimatedNextPeriod.date).toBe(formatISODate(addDays(parseISODate(start), 28)));
    // No history behind a self-report, even a "regular" one, caps confidence at low.
    expect(result.estimatedNextPeriod.confidence).toBe("low");
  });
});

describe("calculateCycleInsights — short cycles, with robust history", () => {
  it("uses the historical average and reaches high confidence for a consistent 21-day cycle", () => {
    const lastStart = "2026-06-01";
    const history = buildRegularHistory(lastStart, 21, 6); // 5 completed cycles
    const today = formatISODate(addDays(parseISODate(lastStart), 3));

    const result = calculateCycleInsights({
      mostRecentPeriodStartDate: lastStart,
      historicalPeriodStartDates: history,
      averageCycleLengthDays: 28, // manual value present but should be overridden
      today,
    });

    expect(result.dataSource.cycleLength).toBe("historical");
    expect(result.dataSource.historicalCyclesUsed).toBe(5);
    expect(result.effectiveCycleLengthDays).toBe(21);
    expect(result.estimatedNextPeriod.confidence).toBe("high");
    expect(result.estimatedOvulationWindow.confidence).toBe("moderate");
  });
});

describe("calculateCycleInsights — long cycles, with robust history", () => {
  it("uses the historical average for a consistent 40-day cycle", () => {
    const lastStart = "2026-06-01";
    const history = buildRegularHistory(lastStart, 40, 5);
    const today = formatISODate(addDays(parseISODate(lastStart), 5));

    const result = calculateCycleInsights({
      mostRecentPeriodStartDate: lastStart,
      historicalPeriodStartDates: history,
      today,
    });

    expect(result.dataSource.cycleLength).toBe("historical");
    expect(result.effectiveCycleLengthDays).toBe(40);
    expect(result.estimatedNextPeriod.date).toBe(
      formatISODate(addDays(parseISODate(lastStart), 40)),
    );
  });
});

describe("calculateCycleInsights — irregular cycles", () => {
  it("keeps confidence low even with plenty of history, when that history is inconsistent", () => {
    const lastStart = "2026-06-01";
    // Wildly varying gaps, 5 completed cycles worth.
    const history = [
      "2025-11-01", // -> next: ~19 days
      "2025-11-20", // -> ~36 days
      "2025-12-26", // -> ~44 days
      "2026-02-08", // -> ~52 days
      "2026-04-01", // -> ~61 days to 2026-06-01
    ];
    const today = formatISODate(addDays(parseISODate(lastStart), 2));

    const result = calculateCycleInsights({
      mostRecentPeriodStartDate: lastStart,
      historicalPeriodStartDates: history,
      today,
    });

    expect(result.dataSource.cycleLength).toBe("historical");
    expect(result.dataSource.variability).toBe("historical");
    expect(result.estimatedNextPeriod.confidence).toBe("low");
    expect(result.estimatedOvulationWindow.confidence).toBe("low");
    // The next-period range should be wide, reflecting real uncertainty.
    const earliest = parseISODate(result.estimatedNextPeriod.earliestDate);
    const latest = parseISODate(result.estimatedNextPeriod.latestDate);
    expect(latest - earliest).toBeGreaterThanOrEqual(6);
  });
});

describe("calculateCycleInsights — missing history", () => {
  it("falls back to manual averages when no history is available", () => {
    const start = "2026-03-01";
    const result = calculateCycleInsights({
      mostRecentPeriodStartDate: start,
      averageCycleLengthDays: 30,
      averagePeriodDurationDays: 6,
      cycleVariability: "somewhat_irregular",
      today: start,
    });

    expect(result.dataSource.cycleLength).toBe("manual");
    expect(result.dataSource.variability).toBe("self_reported");
    expect(result.dataSource.historicalCyclesUsed).toBe(0);
    expect(result.effectiveCycleLengthDays).toBe(30);
    expect(result.effectivePeriodLengthDays).toBe(6);
  });

  it("does not let one or two historical dates override the manual average", () => {
    const lastStart = "2026-03-01";
    // Only one prior date -> a single completed cycle of implied length 35,
    // which is below MIN_CYCLES_FOR_HISTORICAL_PRIORITY.
    const result = calculateCycleInsights({
      mostRecentPeriodStartDate: lastStart,
      historicalPeriodStartDates: [formatISODate(addDays(parseISODate(lastStart), -35))],
      averageCycleLengthDays: 28,
      today: lastStart,
    });

    expect(result.dataSource.cycleLength).toBe("manual");
    expect(result.effectiveCycleLengthDays).toBe(28);
    expect(result.dataSource.historicalCyclesUsed).toBe(1); // reported, even though not authoritative
  });
});

describe("calculateCycleInsights — newly registered users", () => {
  it("uses app defaults and low confidence with nothing but a most-recent start date", () => {
    const start = "2026-03-01";
    const result = calculateCycleInsights({
      mostRecentPeriodStartDate: start,
      today: start,
    });

    expect(result.currentCycleDay).toBe(1);
    expect(result.currentPhase).toBe("menstrual");
    expect(result.effectiveCycleLengthDays).toBe(28);
    expect(result.effectivePeriodLengthDays).toBe(5);
    expect(result.dataSource.cycleLength).toBe("default");
    expect(result.dataSource.variability).toBe("default");
    expect(result.estimatedNextPeriod.confidence).toBe("low");
    expect(result.estimatedOvulationWindow.confidence).toBe("low");
  });

  it("defaults `today` to the real current date when omitted", () => {
    const result = calculateCycleInsights({ mostRecentPeriodStartDate: "2026-01-01" });
    expect(result.today).toBe(formatISODate(todayEpochDays()));
  });
});

describe("calculateCycleInsights — date/timezone edge cases", () => {
  it("reports day 1 when today is the start date itself", () => {
    const result = calculateCycleInsights({
      mostRecentPeriodStartDate: "2026-05-15",
      today: "2026-05-15",
    });
    expect(result.currentCycleDay).toBe(1);
    expect(result.isPeriodLate).toBe(false);
  });

  it("is not yet 'late' on the exact last day of the effective cycle", () => {
    const start = "2026-05-01";
    const today = formatISODate(addDays(parseISODate(start), 27)); // day 28 of a 28-day cycle
    const result = calculateCycleInsights({
      mostRecentPeriodStartDate: start,
      averageCycleLengthDays: 28,
      today,
    });
    expect(result.currentCycleDay).toBe(28);
    expect(result.isPeriodLate).toBe(false);
  });

  it("flags a period as late the day after the effective cycle length elapses", () => {
    const start = "2026-05-01";
    const today = formatISODate(addDays(parseISODate(start), 28)); // day 29 of a 28-day cycle
    const result = calculateCycleInsights({
      mostRecentPeriodStartDate: start,
      averageCycleLengthDays: 28,
      today,
    });
    expect(result.isPeriodLate).toBe(true);
    expect(result.daysLate).toBe(1);
  });

  it("projects the next period forward past multiple missed cycles for a long-dormant user", () => {
    const start = "2026-01-01";
    const today = formatISODate(addDays(parseISODate(start), 100)); // ~3.5 cycles later
    const result = calculateCycleInsights({
      mostRecentPeriodStartDate: start,
      averageCycleLengthDays: 28,
      today,
    });
    const nextEpoch = parseISODate(result.estimatedNextPeriod.date);
    const todayEpoch = parseISODate(today);
    expect(nextEpoch).toBeGreaterThan(todayEpoch);
    expect(result.estimatedNextPeriod.daysUntil).toBeGreaterThan(0);
  });

  it("throws a descriptive error when the start date is after 'today'", () => {
    expect(() =>
      calculateCycleInsights({
        mostRecentPeriodStartDate: "2026-06-01",
        today: "2026-05-01",
      }),
    ).toThrow(CycleInputError);
  });

  it("produces identical results regardless of the host process's local timezone", () => {
    const originalTZ = process.env.TZ;
    try {
      const outputs = ["UTC", "Pacific/Kiritimati", "America/Los_Angeles"].map((tz) => {
        process.env.TZ = tz;
        return calculateCycleInsights({
          mostRecentPeriodStartDate: "2026-05-01",
          averageCycleLengthDays: 28,
          today: "2026-05-20",
        });
      });
      const serialized = outputs.map((o) => JSON.stringify(o));
      expect(new Set(serialized).size).toBe(1);
    } finally {
      process.env.TZ = originalTZ;
    }
  });
});

describe("calculateCycleInsights — leap years", () => {
  it("lands the next period on Feb 29 in a leap year when that's exactly 28 days out", () => {
    const result = calculateCycleInsights({
      mostRecentPeriodStartDate: "2028-02-01",
      averageCycleLengthDays: 28,
      today: "2028-02-01",
    });
    expect(result.estimatedNextPeriod.date).toBe("2028-02-29");
  });

  it("correctly counts the current cycle day across Feb 29", () => {
    const result = calculateCycleInsights({
      mostRecentPeriodStartDate: "2028-02-15",
      averageCycleLengthDays: 28,
      today: "2028-03-15", // Feb 2028 has 29 days
    });
    // Feb 15 -> Mar 15 across a leap Feb is 29 days, so this is cycle day 30.
    expect(result.currentCycleDay).toBe(30);
  });
});

describe("calculateCycleInsights — month transitions", () => {
  it("rolls the next-period estimate correctly from a 30/31-day month into the next", () => {
    const result = calculateCycleInsights({
      mostRecentPeriodStartDate: "2026-01-30",
      averageCycleLengthDays: 28,
      today: "2026-01-30",
    });
    expect(result.estimatedNextPeriod.date).toBe("2026-02-27");
  });

  it("rolls correctly across a year boundary", () => {
    const result = calculateCycleInsights({
      mostRecentPeriodStartDate: "2026-12-10",
      averageCycleLengthDays: 28,
      today: "2026-12-10",
    });
    expect(result.estimatedNextPeriod.date).toBe("2027-01-07");
  });
});

describe("calculateCycleInsights — historical priority over manual averages", () => {
  it("prefers the historical average over a conflicting manual entry once there's enough history", () => {
    const lastStart = "2026-06-01";
    const history = buildRegularHistory(lastStart, 32, 4); // 3 completed cycles of 32 days
    const result = calculateCycleInsights({
      mostRecentPeriodStartDate: lastStart,
      historicalPeriodStartDates: history,
      averageCycleLengthDays: 28,
      today: lastStart,
    });

    expect(result.dataSource.cycleLength).toBe("historical");
    expect(result.effectiveCycleLengthDays).toBe(32);
    expect(result.effectiveCycleLengthDays).not.toBe(28);
  });
});

describe("calculateCycleInsights — wording and disclaimers", () => {
  it("labels the ovulation phase with the required non-committal wording", () => {
    expect(PHASE_LABELS.ovulation_window).toBe("Estimated ovulation window");
    expect(PHASE_LABELS.menstrual).toMatch(/^Estimated/);
    expect(PHASE_LABELS.follicular).toMatch(/^Estimated/);
    expect(PHASE_LABELS.luteal).toMatch(/^Estimated/);
  });

  it("never presents the app as contraception", () => {
    expect(CYCLE_DISCLAIMERS.notContraception.toLowerCase()).toContain("contraception");
  });

  it("frames ovulation timing as an estimate, not a certainty", () => {
    expect(CYCLE_DISCLAIMERS.ovulation.toLowerCase()).toContain("estimated");
  });

  it("includes disclaimers on every result, unmodified from the shared constant", () => {
    const result = calculateCycleInsights({ mostRecentPeriodStartDate: "2026-01-01", today: "2026-01-05" });
    expect(result.disclaimers).toEqual(CYCLE_DISCLAIMERS);
  });
});

describe("calculateCycleInsights — structural invariants", () => {
  const fixtures: Array<Parameters<typeof calculateCycleInsights>[0]> = [
    { mostRecentPeriodStartDate: "2026-01-01", today: "2026-01-10" },
    {
      mostRecentPeriodStartDate: "2026-01-01",
      today: "2026-01-10",
      averageCycleLengthDays: 21,
      cycleVariability: "irregular",
    },
    {
      mostRecentPeriodStartDate: "2026-06-01",
      historicalPeriodStartDates: buildRegularHistory("2026-06-01", 35, 6),
      today: "2026-06-10",
    },
  ];

  it.each(fixtures)("ovulation confidence never exceeds next-period confidence", (input) => {
    const result = calculateCycleInsights(input);
    expect(RANK[result.estimatedOvulationWindow.confidence]).toBeLessThanOrEqual(
      RANK[result.estimatedNextPeriod.confidence],
    );
  });

  it.each(fixtures)("phases cover the full cycle with valid, ordered ISO dates", (input) => {
    const result = calculateCycleInsights(input);
    expect(result.phases.length).toBeGreaterThan(0);
    for (const phase of result.phases) {
      expect(parseISODate(phase.startDate)).toBeLessThanOrEqual(parseISODate(phase.endDate));
      expect(phase.startDayOfCycle).toBeLessThanOrEqual(phase.endDayOfCycle);
    }
    const first = result.phases[0];
    const last = result.phases[result.phases.length - 1];
    expect(first.startDayOfCycle).toBe(1);
    expect(last.endDayOfCycle).toBe(result.effectiveCycleLengthDays);
  });

  it.each(fixtures)("estimated next period is always strictly after 'today'", (input) => {
    const result = calculateCycleInsights(input);
    const today = parseISODate(result.today);
    expect(parseISODate(result.estimatedNextPeriod.date)).toBeGreaterThan(today);
    expect(result.estimatedNextPeriod.daysUntil).toBeGreaterThan(0);
  });
});
