import { describe, expect, it } from "vitest";
import { diffDays, parseISODate } from "@/lib/cycle-engine";
import { buildCalendarDayEstimates } from "../phase-map";

const HISTORICAL_STARTS = ["2026-01-01", "2026-01-29"]; // one confirmed 28-day cycle

function find(results: ReturnType<typeof buildCalendarDayEstimates>, date: string) {
  return results.find((r) => r.date === date);
}

describe("buildCalendarDayEstimates", () => {
  it("returns nothing with no logged history at all", () => {
    const results = buildCalendarDayEstimates({
      historicalStartDates: [],
      effectiveCycleLengthDays: 28,
      effectivePeriodLengthDays: 5,
      rangeStart: "2026-01-01",
      rangeEnd: "2026-01-31",
    });
    expect(results).toEqual([]);
  });

  it("returns nothing for a range entirely before the earliest known start", () => {
    const results = buildCalendarDayEstimates({
      historicalStartDates: HISTORICAL_STARTS,
      effectiveCycleLengthDays: 28,
      effectivePeriodLengthDays: 5,
      rangeStart: "2025-11-01",
      rangeEnd: "2025-11-30",
    });
    expect(results).toEqual([]);
  });

  it("marks a day within a known (logged) cycle as not projected", () => {
    const results = buildCalendarDayEstimates({
      historicalStartDates: HISTORICAL_STARTS,
      effectiveCycleLengthDays: 28,
      effectivePeriodLengthDays: 5,
      rangeStart: "2026-01-01",
      rangeEnd: "2026-01-31",
    });
    const day1 = find(results, "2026-01-01");
    expect(day1).toMatchObject({ cycleDay: 1, phase: "menstrual", isProjectedCycle: false });
  });

  it("marks the cycle starting at the last known date as not projected, even though its length is inferred", () => {
    const results = buildCalendarDayEstimates({
      historicalStartDates: HISTORICAL_STARTS,
      effectiveCycleLengthDays: 28,
      effectivePeriodLengthDays: 5,
      rangeStart: "2026-01-29",
      rangeEnd: "2026-01-29",
    });
    expect(find(results, "2026-01-29")).toMatchObject({
      cycleDay: 1,
      phase: "menstrual",
      isProjectedCycle: false,
    });
  });

  it("marks a fully projected future cycle as projected", () => {
    const results = buildCalendarDayEstimates({
      historicalStartDates: HISTORICAL_STARTS,
      effectiveCycleLengthDays: 28,
      effectivePeriodLengthDays: 5,
      rangeStart: "2026-01-01",
      rangeEnd: "2026-03-15",
    });

    // Third cycle start is projected: 2026-01-29 + 28 days.
    const projectedStart = "2026-02-26";
    expect(find(results, projectedStart)).toMatchObject({
      cycleDay: 1,
      phase: "menstrual",
      isProjectedCycle: true,
    });
  });

  it("computes cycle day correctly against an independently-derived expectation", () => {
    const results = buildCalendarDayEstimates({
      historicalStartDates: HISTORICAL_STARTS,
      effectiveCycleLengthDays: 28,
      effectivePeriodLengthDays: 5,
      rangeStart: "2026-01-01",
      rangeEnd: "2026-03-15",
    });

    const cycle3Start = parseISODate("2026-02-26");
    const target = parseISODate("2026-03-10");
    const expectedCycleDay = diffDays(target, cycle3Start) + 1;

    expect(find(results, "2026-03-10")?.cycleDay).toBe(expectedCycleDay);
  });

  it("produces exactly one entry per day in range once history exists", () => {
    const results = buildCalendarDayEstimates({
      historicalStartDates: HISTORICAL_STARTS,
      effectiveCycleLengthDays: 28,
      effectivePeriodLengthDays: 5,
      rangeStart: "2026-01-01",
      rangeEnd: "2026-01-31",
    });
    expect(results).toHaveLength(31);
    const dates = new Set(results.map((r) => r.date));
    expect(dates.size).toBe(31);
  });

  it("clips a cycle to the requested range rather than overflowing it", () => {
    const results = buildCalendarDayEstimates({
      historicalStartDates: HISTORICAL_STARTS,
      effectiveCycleLengthDays: 28,
      effectivePeriodLengthDays: 5,
      rangeStart: "2026-01-15",
      rangeEnd: "2026-01-20",
    });
    expect(results).toHaveLength(6);
    expect(results.every((r) => r.date >= "2026-01-15" && r.date <= "2026-01-20")).toBe(true);
  });

  it("assigns the correct phase for a day deep in a projected cycle's luteal window", () => {
    const results = buildCalendarDayEstimates({
      historicalStartDates: HISTORICAL_STARTS,
      effectiveCycleLengthDays: 28,
      effectivePeriodLengthDays: 5,
      rangeStart: "2026-01-01",
      rangeEnd: "2026-03-20",
    });
    // Cycle 3 starts 2026-02-26; luteal is days 17-28 -> 2026-03-14 to 2026-03-25.
    expect(find(results, "2026-03-16")?.phase).toBe("luteal");
  });
});
