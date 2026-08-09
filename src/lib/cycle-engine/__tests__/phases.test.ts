import { describe, expect, it } from "vitest";
import { parseISODate } from "../date-utils";
import {
  buildPhaseRanges,
  classifyCurrentPhase,
  computePhaseDayBoundaries,
  estimateOvulationDayOfCycle,
} from "../phases";

describe("estimateOvulationDayOfCycle", () => {
  it("is ~14 days before the end of a standard 28-day cycle", () => {
    expect(estimateOvulationDayOfCycle(28, 5)).toBe(14);
  });

  it("scales down for a short cycle without going non-positive", () => {
    const day = estimateOvulationDayOfCycle(21, 5);
    expect(day).toBeGreaterThan(0);
    expect(day).toBeLessThan(21);
  });

  it("scales up for a long cycle", () => {
    expect(estimateOvulationDayOfCycle(40, 5)).toBe(26);
  });

  it("stays inside the cycle even for a pathological short-cycle/long-period combination", () => {
    const day = estimateOvulationDayOfCycle(15, 14);
    expect(day).toBeGreaterThanOrEqual(1);
    expect(day).toBeLessThanOrEqual(15);
  });
});

describe("computePhaseDayBoundaries", () => {
  const cases: Array<[number, number, string]> = [
    [28, 5, "standard 28-day cycle"],
    [21, 4, "short cycle"],
    [45, 6, "long cycle"],
    [15, 14, "extreme short cycle, long period"],
    [60, 1, "extreme long cycle, short period"],
  ];

  it.each(cases)("covers every day of the cycle exactly once (%s: %s)", (cycleLength, periodLength) => {
    const boundaries = computePhaseDayBoundaries(cycleLength, periodLength);
    const covered = new Set<number>();
    const ranges = [
      boundaries.menstrual,
      boundaries.follicular,
      boundaries.ovulationWindow,
      boundaries.luteal,
    ].filter((r): r is [number, number] => r !== null);

    for (const [start, end] of ranges) {
      expect(start).toBeLessThanOrEqual(end);
      for (let day = start; day <= end; day++) {
        expect(covered.has(day)).toBe(false); // no overlap
        covered.add(day);
      }
    }

    expect(covered.size).toBe(cycleLength);
    expect(Math.min(...covered)).toBe(1);
    expect(Math.max(...covered)).toBe(cycleLength);
  });

  it("menstrual phase starts on day 1 and matches the period length", () => {
    const boundaries = computePhaseDayBoundaries(28, 5);
    expect(boundaries.menstrual).toEqual([1, 5]);
  });
});

describe("classifyCurrentPhase", () => {
  const boundaries = computePhaseDayBoundaries(28, 5);
  // menstrual [1,5], follicular [6,11], ovulation [12,16], luteal [17,28]

  it.each([
    [1, "menstrual"],
    [5, "menstrual"],
    [6, "follicular"],
    [11, "follicular"],
    [12, "ovulation_window"],
    [16, "ovulation_window"],
    [17, "luteal"],
    [28, "luteal"],
  ] as const)("day %i -> %s", (day, expected) => {
    expect(classifyCurrentPhase(day, boundaries)).toBe(expected);
  });

  it("clamps a late cycle day into the final phase instead of throwing", () => {
    expect(classifyCurrentPhase(45, boundaries)).toBe("luteal");
  });
});

describe("buildPhaseRanges", () => {
  it("anchors phase dates to the cycle start date", () => {
    const start = parseISODate("2026-03-01");
    const boundaries = computePhaseDayBoundaries(28, 5);
    const ranges = buildPhaseRanges(start, boundaries);

    const menstrual = ranges.find((r) => r.phase === "menstrual");
    expect(menstrual?.startDate).toBe("2026-03-01");
    expect(menstrual?.endDate).toBe("2026-03-05");

    const ovulation = ranges.find((r) => r.phase === "ovulation_window");
    // day 12-16 of a cycle starting 2026-03-01 -> Mar 12 - Mar 16
    expect(ovulation?.startDate).toBe("2026-03-12");
    expect(ovulation?.endDate).toBe("2026-03-16");
  });

  it("returns phases in chronological order", () => {
    const start = parseISODate("2026-03-01");
    const boundaries = computePhaseDayBoundaries(28, 5);
    const ranges = buildPhaseRanges(start, boundaries);
    const order = ranges.map((r) => r.phase);
    expect(order).toEqual(["menstrual", "follicular", "ovulation_window", "luteal"]);
  });
});
