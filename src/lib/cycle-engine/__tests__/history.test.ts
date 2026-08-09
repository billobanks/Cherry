import { describe, expect, it } from "vitest";
import {
  buildCycleStartSequence,
  classifyVariabilityFromStdDev,
  computeHistoricalCycleStats,
  deriveCycleLengthsFromSequence,
  mean,
  standardDeviation,
} from "../history";

describe("buildCycleStartSequence", () => {
  it("sorts ascending and appends the most recent date last", () => {
    const sequence = buildCycleStartSequence("2026-03-01", ["2026-01-01", "2026-02-01"]);
    expect(sequence.length).toBe(3);
    expect(sequence[0]).toBeLessThan(sequence[1]);
    expect(sequence[1]).toBeLessThan(sequence[2]);
  });

  it("dedupes and drops dates on or after the most recent date", () => {
    const sequence = buildCycleStartSequence("2026-03-01", [
      "2026-01-01",
      "2026-01-01", // duplicate
      "2026-03-01", // same as most recent
      "2026-04-01", // after most recent — bad data, should be ignored
    ]);
    expect(sequence.length).toBe(2); // 2026-01-01, 2026-03-01
  });

  it("handles no history at all", () => {
    expect(buildCycleStartSequence("2026-03-01", [])).toHaveLength(1);
  });
});

describe("deriveCycleLengthsFromSequence", () => {
  it("returns consecutive differences", () => {
    const sequence = buildCycleStartSequence("2026-03-29", ["2026-01-01", "2026-01-29"]);
    // Jan 1 -> Jan 29 = 28, Jan 29 -> Mar 29 = 59
    expect(deriveCycleLengthsFromSequence(sequence)).toEqual([28, 59]);
  });

  it("returns an empty array with only one date", () => {
    const sequence = buildCycleStartSequence("2026-03-01", []);
    expect(deriveCycleLengthsFromSequence(sequence)).toEqual([]);
  });
});

describe("mean / standardDeviation", () => {
  it("computes the mean", () => {
    expect(mean([28, 28, 28])).toBe(28);
    expect(mean([26, 30])).toBe(28);
  });

  it("mean of an empty array is 0", () => {
    expect(mean([])).toBe(0);
  });

  it("stddev is 0 for identical values", () => {
    expect(standardDeviation([28, 28, 28, 28])).toBe(0);
  });

  it("stddev is 0 with fewer than two values", () => {
    expect(standardDeviation([28])).toBe(0);
    expect(standardDeviation([])).toBe(0);
  });

  it("stddev grows with spread", () => {
    const tight = standardDeviation([27, 28, 29]);
    const wide = standardDeviation([20, 28, 36]);
    expect(wide).toBeGreaterThan(tight);
  });
});

describe("classifyVariabilityFromStdDev", () => {
  it("classifies low spread as regular", () => {
    expect(classifyVariabilityFromStdDev(0)).toBe("regular");
    expect(classifyVariabilityFromStdDev(2)).toBe("regular");
  });

  it("classifies moderate spread as somewhat_irregular", () => {
    expect(classifyVariabilityFromStdDev(3)).toBe("somewhat_irregular");
    expect(classifyVariabilityFromStdDev(5)).toBe("somewhat_irregular");
  });

  it("classifies wide spread as irregular", () => {
    expect(classifyVariabilityFromStdDev(6)).toBe("irregular");
    expect(classifyVariabilityFromStdDev(15)).toBe("irregular");
  });
});

describe("computeHistoricalCycleStats", () => {
  it("reports zero cycles with no history", () => {
    const stats = computeHistoricalCycleStats("2026-03-01", []);
    expect(stats.cyclesUsed).toBe(0);
    expect(stats.averageCycleLengthDays).toBeNull();
    expect(stats.variability).toBeNull();
  });

  it("computes average length and regular variability for consistent 28-day cycles", () => {
    const stats = computeHistoricalCycleStats("2026-04-23", [
      "2026-01-01",
      "2026-01-29",
      "2026-02-26",
      "2026-03-26",
    ]);
    expect(stats.cyclesUsed).toBe(4);
    expect(stats.averageCycleLengthDays).toBe(28);
    expect(stats.variability).toBe("regular");
  });

  it("flags a genuinely irregular history", () => {
    const stats = computeHistoricalCycleStats("2026-06-01", [
      "2026-01-01", // -> Jan 20: 19 days
      "2026-01-20", // -> Feb 25: 36 days
      "2026-02-25", // -> Apr 10: 44 days
      "2026-04-10", // -> Jun 1: 52 days
    ]);
    expect(stats.cyclesUsed).toBe(4);
    expect(stats.variability).toBe("irregular");
  });
});
