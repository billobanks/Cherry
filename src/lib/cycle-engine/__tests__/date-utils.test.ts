import { describe, expect, it } from "vitest";
import {
  InvalidDateError,
  addDays,
  diffDays,
  formatISODate,
  parseISODate,
} from "../date-utils";

describe("parseISODate / formatISODate", () => {
  it("round-trips a normal date", () => {
    expect(formatISODate(parseISODate("2026-03-15"))).toBe("2026-03-15");
  });

  it("round-trips the first and last day of a month", () => {
    expect(formatISODate(parseISODate("2026-04-01"))).toBe("2026-04-01");
    expect(formatISODate(parseISODate("2026-04-30"))).toBe("2026-04-30");
  });

  it("rejects malformed strings", () => {
    expect(() => parseISODate("2026/03/15")).toThrow(InvalidDateError);
    expect(() => parseISODate("15-03-2026")).toThrow(InvalidDateError);
    expect(() => parseISODate("not-a-date")).toThrow(InvalidDateError);
    expect(() => parseISODate("")).toThrow(InvalidDateError);
  });

  it("rejects calendar-invalid dates instead of silently rolling them over", () => {
    // Date.UTC would otherwise happily turn Feb 30 into Mar 2.
    expect(() => parseISODate("2026-02-30")).toThrow(InvalidDateError);
    expect(() => parseISODate("2026-13-01")).toThrow(InvalidDateError);
    expect(() => parseISODate("2026-00-10")).toThrow(InvalidDateError);
    // 2026 is not a leap year.
    expect(() => parseISODate("2026-02-29")).toThrow(InvalidDateError);
  });

  describe("leap years", () => {
    it("accepts Feb 29 in a leap year", () => {
      expect(formatISODate(parseISODate("2028-02-29"))).toBe("2028-02-29");
      expect(formatISODate(parseISODate("2024-02-29"))).toBe("2024-02-29");
    });

    it("rejects Feb 29 in a non-leap century year", () => {
      // 2100 is divisible by 4 but not by 400 — not a leap year.
      expect(() => parseISODate("2100-02-29")).toThrow(InvalidDateError);
    });

    it("accepts Feb 29 in a leap century year", () => {
      expect(formatISODate(parseISODate("2000-02-29"))).toBe("2000-02-29");
    });

    it("counts 29 days from Feb 1 to Mar 1 in a leap year, 28 in a non-leap year", () => {
      const leapDiff = diffDays(parseISODate("2028-03-01"), parseISODate("2028-02-01"));
      const nonLeapDiff = diffDays(parseISODate("2026-03-01"), parseISODate("2026-02-01"));
      expect(leapDiff).toBe(29);
      expect(nonLeapDiff).toBe(28);
    });
  });

  describe("month and year transitions", () => {
    it("adds days across a month boundary", () => {
      expect(formatISODate(addDays(parseISODate("2026-01-30"), 5))).toBe("2026-02-04");
    });

    it("adds days across a year boundary", () => {
      expect(formatISODate(addDays(parseISODate("2026-12-20"), 15))).toBe("2027-01-04");
    });

    it("diffDays across a month/year boundary matches the calendar gap", () => {
      expect(diffDays(parseISODate("2027-01-05"), parseISODate("2026-12-20"))).toBe(16);
    });
  });

  it("is unaffected by the host process's local timezone", () => {
    const originalTZ = process.env.TZ;
    try {
      const results = ["Pacific/Kiritimati", "America/Los_Angeles", "UTC", "Asia/Kolkata"].map(
        (tz) => {
          process.env.TZ = tz;
          const start = parseISODate("2026-01-30");
          return formatISODate(addDays(start, 5));
        },
      );
      expect(new Set(results).size).toBe(1);
      expect(results[0]).toBe("2026-02-04");
    } finally {
      process.env.TZ = originalTZ;
    }
  });
});
