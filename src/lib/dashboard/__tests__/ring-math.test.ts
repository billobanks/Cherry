import { describe, expect, it } from "vitest";
import { computePhaseDayBoundaries, buildPhaseRanges, parseISODate } from "@/lib/cycle-engine";
import {
  computeMarkerAngleDegrees,
  computeRingSegments,
  describeArc,
  polarToCartesian,
} from "../ring-math";

describe("computeRingSegments", () => {
  it("covers the full 360 degrees with no gaps for a standard 28-day cycle", () => {
    const boundaries = computePhaseDayBoundaries(28, 5);
    const phases = buildPhaseRanges(parseISODate("2026-03-01"), boundaries);
    const segments = computeRingSegments(phases, 28);

    expect(segments[0].startAngle).toBe(0);
    expect(segments[segments.length - 1].endAngle).toBe(360);
    for (let i = 1; i < segments.length; i++) {
      expect(segments[i].startAngle).toBeCloseTo(segments[i - 1].endAngle, 5);
    }
  });

  it("gives each phase an angle proportional to its length", () => {
    const boundaries = computePhaseDayBoundaries(28, 5);
    const phases = buildPhaseRanges(parseISODate("2026-03-01"), boundaries);
    const segments = computeRingSegments(phases, 28);

    const menstrual = segments.find((s) => s.phase === "menstrual")!;
    // menstrual is days 1-5 of 28 -> 5/28 * 360
    expect(menstrual.endAngle - menstrual.startAngle).toBeCloseTo((5 / 28) * 360, 5);
  });
});

describe("computeMarkerAngleDegrees", () => {
  it("places day 1 near the top of the ring", () => {
    const angle = computeMarkerAngleDegrees(1, 28);
    expect(angle).toBeGreaterThan(0);
    expect(angle).toBeLessThan(360 / 28); // within the first day's slice
  });

  it("places the marker at the center of that day's slice, not the boundary between days", () => {
    // Day 14 of 28 spans angle [167.14, 180); the marker sits at its midpoint, not exactly 180.
    const angle = computeMarkerAngleDegrees(14, 28);
    expect(angle).toBeCloseTo(((14 - 0.5) / 28) * 360, 5);
    expect(angle).toBeGreaterThan((13 / 28) * 360);
    expect(angle).toBeLessThan((14 / 28) * 360);
  });

  it("clamps a late cycle day to the end of the ring instead of wrapping past 360", () => {
    const angle = computeMarkerAngleDegrees(45, 28);
    expect(angle).toBeLessThanOrEqual(360);
    expect(angle).toBeGreaterThan(350);
  });

  it("never returns an angle below 0", () => {
    expect(computeMarkerAngleDegrees(0, 28)).toBeGreaterThanOrEqual(0);
  });
});

describe("polarToCartesian", () => {
  it("places angle 0 at the top of the circle", () => {
    const point = polarToCartesian(50, 50, 40, 0);
    expect(point.x).toBeCloseTo(50, 5);
    expect(point.y).toBeCloseTo(10, 5); // cy - r
  });

  it("places angle 90 at the right of the circle (clockwise from top)", () => {
    const point = polarToCartesian(50, 50, 40, 90);
    expect(point.x).toBeCloseTo(90, 5); // cx + r
    expect(point.y).toBeCloseTo(50, 5);
  });

  it("places angle 180 at the bottom of the circle", () => {
    const point = polarToCartesian(50, 50, 40, 180);
    expect(point.x).toBeCloseTo(50, 5);
    expect(point.y).toBeCloseTo(90, 5); // cy + r
  });
});

describe("describeArc", () => {
  it("produces a well-formed SVG path string", () => {
    const d = describeArc(50, 50, 40, 0, 90);
    expect(d).toMatch(/^M [\d.-]+ [\d.-]+ A 40 40 0 [01] 1 [\d.-]+ [\d.-]+$/);
  });

  it("sets the large-arc flag for spans over 180 degrees", () => {
    expect(describeArc(50, 50, 40, 0, 200)).toMatch(/A 40 40 0 1 1/);
  });

  it("clears the large-arc flag for spans of 180 degrees or under", () => {
    expect(describeArc(50, 50, 40, 0, 180)).toMatch(/A 40 40 0 0 1/);
  });
});
