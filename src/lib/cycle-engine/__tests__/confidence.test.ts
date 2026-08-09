import { describe, expect, it } from "vitest";
import {
  classifyDataQuality,
  computeOvulationConfidence,
  computePeriodConfidence,
} from "../confidence";
import type { ConfidenceLevel, SelfReportedVariability } from "../types";

describe("classifyDataQuality", () => {
  it.each([
    [0, "none"],
    [1, "minimal"],
    [2, "minimal"],
    [3, "moderate"],
    [4, "moderate"],
    [5, "robust"],
    [12, "robust"],
  ] as const)("%i cycles -> %s", (cycles, expected) => {
    expect(classifyDataQuality(cycles)).toBe(expected);
  });
});

describe("computePeriodConfidence", () => {
  it("reaches high confidence only with robust data and regular cycles", () => {
    expect(computePeriodConfidence("robust", "regular")).toBe("high");
  });

  it("insufficient history caps confidence at low, regardless of a regular self-report", () => {
    expect(computePeriodConfidence("none", "regular")).toBe("low");
    expect(computePeriodConfidence("minimal", "regular")).toBe("low");
  });

  it("irregular cycles pull even robust data down", () => {
    expect(computePeriodConfidence("robust", "irregular")).toBe("low");
  });

  it("moderate data with regular cycles lands on moderate", () => {
    expect(computePeriodConfidence("moderate", "regular")).toBe("moderate");
  });

  it("never reports higher than what the weaker signal (data or regularity) supports", () => {
    // Robust history but the person says "not sure" -> still gets knocked down.
    expect(computePeriodConfidence("robust", "not_sure")).toBe("moderate");
  });

  it("confidence never drops below low", () => {
    expect(computePeriodConfidence("none", "irregular")).toBe("low");
  });
});

describe("computeOvulationConfidence", () => {
  const levels: ConfidenceLevel[] = ["low", "moderate", "high"];
  const rank: Record<ConfidenceLevel, number> = { low: 0, moderate: 1, high: 2 };

  it.each(levels)("is never higher than the period confidence it's derived from (%s)", (level) => {
    expect(rank[computeOvulationConfidence(level)]).toBeLessThanOrEqual(rank[level]);
  });

  it("is strictly lower than period confidence whenever that isn't already the floor", () => {
    expect(computeOvulationConfidence("high")).toBe("moderate");
    expect(computeOvulationConfidence("moderate")).toBe("low");
  });

  it("never reports high ovulation confidence under any circumstances", () => {
    const allVariabilities: SelfReportedVariability[] = [
      "regular",
      "somewhat_irregular",
      "irregular",
      "not_sure",
    ];
    const allQualities = ["none", "minimal", "moderate", "robust"] as const;

    for (const quality of allQualities) {
      for (const variability of allVariabilities) {
        const period = computePeriodConfidence(quality, variability);
        expect(computeOvulationConfidence(period)).not.toBe("high");
      }
    }
  });

  it("floors at low", () => {
    expect(computeOvulationConfidence("low")).toBe("low");
  });
});
