import { describe, expect, it } from "vitest";
import { parseISODate } from "@/lib/cycle-engine";
import { addMonths, buildMonthGrid, formatMonthLabel } from "../grid";

describe("buildMonthGrid", () => {
  it("produces a whole number of weeks", () => {
    const grid = buildMonthGrid(2026, 8);
    expect(grid.length % 7).toBe(0);
  });

  it("starts on a Sunday", () => {
    const grid = buildMonthGrid(2026, 8);
    const firstDate = new Date(`${grid[0].date}T00:00:00Z`);
    expect(firstDate.getUTCDay()).toBe(0);
  });

  it("contains every day of the month exactly once, correctly flagged", () => {
    const grid = buildMonthGrid(2026, 8); // August has 31 days
    const currentMonthDays = grid.filter((d) => d.isCurrentMonth);
    expect(currentMonthDays).toHaveLength(31);
    expect(currentMonthDays[0].date).toBe("2026-08-01");
    expect(currentMonthDays[currentMonthDays.length - 1].date).toBe("2026-08-31");
  });

  it("dates are consecutive with no gaps or duplicates", () => {
    const grid = buildMonthGrid(2026, 8);
    for (let i = 1; i < grid.length; i++) {
      expect(parseISODate(grid[i].date)).toBe(parseISODate(grid[i - 1].date) + 1);
    }
  });

  it("handles February in a leap year (29 days)", () => {
    const grid = buildMonthGrid(2028, 2);
    expect(grid.filter((d) => d.isCurrentMonth)).toHaveLength(29);
  });

  it("handles February in a non-leap year (28 days)", () => {
    const grid = buildMonthGrid(2026, 2);
    expect(grid.filter((d) => d.isCurrentMonth)).toHaveLength(28);
  });

  it("handles December correctly (year boundary for the next-month calculation)", () => {
    const grid = buildMonthGrid(2026, 12);
    const currentMonthDays = grid.filter((d) => d.isCurrentMonth);
    expect(currentMonthDays).toHaveLength(31);
    expect(currentMonthDays[currentMonthDays.length - 1].date).toBe("2026-12-31");
  });
});

describe("addMonths", () => {
  it("advances within a year", () => {
    expect(addMonths(2026, 8, 1)).toEqual({ year: 2026, month: 9 });
  });

  it("rolls over into the next year", () => {
    expect(addMonths(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });

  it("rolls back into the previous year", () => {
    expect(addMonths(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });

  it("handles multi-month jumps", () => {
    expect(addMonths(2026, 8, 6)).toEqual({ year: 2027, month: 2 });
    expect(addMonths(2026, 8, -10)).toEqual({ year: 2025, month: 10 });
  });
});

describe("formatMonthLabel", () => {
  it("formats a month and year", () => {
    expect(formatMonthLabel(2026, 8)).toBe("August 2026");
    expect(formatMonthLabel(2027, 1)).toBe("January 2027");
  });
});
