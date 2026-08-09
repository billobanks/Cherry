import { describe, expect, it } from "vitest";
import { buildPhaseRanges, computePhaseDayBoundaries, parseISODate } from "@/lib/cycle-engine";
import { computeUpcomingChanges, formatDaysFromNow } from "../upcoming-changes";

const cycleStart = parseISODate("2026-03-01");
const boundaries = computePhaseDayBoundaries(28, 5); // menstrual[1,5] follicular[6,11] ovulation[12,16] luteal[17,28]
const phases = buildPhaseRanges(cycleStart, boundaries);

describe("computeUpcomingChanges", () => {
  it("includes a phase transition that falls within the lookahead window", () => {
    // today is day 10 (follicular); ovulation window begins day 12 -> 2 days away
    const changes = computeUpcomingChanges({
      today: "2026-03-10",
      currentCycleDay: 10,
      phases,
      nextPeriodDate: "2026-03-29",
      lookaheadDays: 5,
    });

    const ovulation = changes.find((c) => c.label.includes("ovulation"));
    expect(ovulation).toBeDefined();
    expect(ovulation?.daysFromNow).toBe(2);
  });

  it("excludes phase transitions that already happened", () => {
    // today is day 20 (luteal); menstrual/follicular/ovulation have all already started
    const changes = computeUpcomingChanges({
      today: "2026-03-20",
      currentCycleDay: 20,
      phases,
      nextPeriodDate: "2026-03-29",
      lookaheadDays: 5,
    });

    expect(changes.some((c) => c.label.includes("follicular"))).toBe(false);
    expect(changes.some((c) => c.label.includes("ovulation"))).toBe(false);
  });

  it("excludes transitions beyond the lookahead window", () => {
    // today is day 1; ovulation begins day 12, 11 days away — outside a 5-day window
    const changes = computeUpcomingChanges({
      today: "2026-03-01",
      currentCycleDay: 1,
      phases,
      nextPeriodDate: "2026-03-29",
      lookaheadDays: 5,
    });

    expect(changes.some((c) => c.label.includes("ovulation"))).toBe(false);
  });

  it("includes the next period when it falls within the lookahead window", () => {
    const changes = computeUpcomingChanges({
      today: "2026-03-25",
      currentCycleDay: 25,
      phases,
      nextPeriodDate: "2026-03-29",
      lookaheadDays: 5,
    });

    const period = changes.find((c) => c.label === "Next period estimated");
    expect(period).toBeDefined();
    expect(period?.daysFromNow).toBe(4);
  });

  it("sorts results by how soon they happen", () => {
    const changes = computeUpcomingChanges({
      today: "2026-03-10",
      currentCycleDay: 10,
      phases,
      nextPeriodDate: "2026-03-13",
      lookaheadDays: 10,
    });

    const daysList = changes.map((c) => c.daysFromNow);
    expect(daysList).toEqual([...daysList].sort((a, b) => a - b));
  });

  it("returns an empty list when nothing is coming up in the window", () => {
    const changes = computeUpcomingChanges({
      today: "2026-03-20",
      currentCycleDay: 20,
      phases,
      nextPeriodDate: "2026-04-15",
      lookaheadDays: 3,
    });
    expect(changes).toEqual([]);
  });
});

describe("formatDaysFromNow", () => {
  it("special-cases tomorrow", () => {
    expect(formatDaysFromNow(1)).toBe("Tomorrow");
  });

  it("formats other day counts generically", () => {
    expect(formatDaysFromNow(3)).toBe("In 3 days");
  });
});
