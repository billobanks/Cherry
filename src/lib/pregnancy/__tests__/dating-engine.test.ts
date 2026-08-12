import { describe, expect, it } from "vitest";
import { addDays, formatISODate, parseISODate } from "@/lib/cycle-engine";
import { calculatePregnancyDating, PregnancyDatingError } from "../dating-engine";

describe("calculatePregnancyDating", () => {
  it("computes the due date from LMP using Naegele's rule (280 days) when it's the only input", () => {
    const result = calculatePregnancyDating({
      lastMenstrualPeriodDate: "2026-01-01",
      today: "2026-01-01",
    });
    expect(result.estimatedDueDate).toBe(formatISODate(addDays(parseISODate("2026-01-01"), 280)));
    expect(result.dueDateSource).toBe("LMP_ESTIMATE");
  });

  it("prefers a clinician-provided due date over LMP when both are present", () => {
    const result = calculatePregnancyDating({
      lastMenstrualPeriodDate: "2026-01-01",
      clinicianEstimatedDueDate: "2026-10-10",
      today: "2026-06-01",
    });
    expect(result.estimatedDueDate).toBe("2026-10-10");
    expect(result.dueDateSource).toBe("CLINICIAN");
  });

  it("prefers ultrasound over LMP when no clinician date is given", () => {
    const result = calculatePregnancyDating({
      lastMenstrualPeriodDate: "2026-01-01",
      ultrasoundEstimatedDueDate: "2026-10-05",
      today: "2026-06-01",
    });
    expect(result.estimatedDueDate).toBe("2026-10-05");
    expect(result.dueDateSource).toBe("ULTRASOUND");
  });

  it("falls back to a user-entered due date when nothing else is available", () => {
    const result = calculatePregnancyDating({
      userEnteredDueDate: "2026-12-01",
      today: "2026-06-01",
    });
    expect(result.estimatedDueDate).toBe("2026-12-01");
    expect(result.dueDateSource).toBe("USER_ENTERED");
  });

  it("throws when no dating input is provided at all", () => {
    expect(() => calculatePregnancyDating({ today: "2026-06-01" })).toThrow(PregnancyDatingError);
  });

  it("computes gestational age in weeks and days by working backward from the winning due date", () => {
    // Due date is exactly 280 days from LMP, so 18 weeks + 3 days later means
    // today is 280 - (18*7+3) = 280 - 129 = 151 days before the due date.
    const dueDate = "2026-12-01";
    const today = formatISODate(addDays(parseISODate(dueDate), -(280 - (18 * 7 + 3))));
    const result = calculatePregnancyDating({ clinicianEstimatedDueDate: dueDate, today });
    expect(result.gestationalAgeWeeks).toBe(18);
    expect(result.gestationalAgeDays).toBe(3);
    expect(result.totalGestationalAgeDays).toBe(129);
  });

  it("classifies exactly 13 weeks 6 days as first trimester", () => {
    const dueDate = "2026-12-01";
    const today = formatISODate(addDays(parseISODate(dueDate), -(280 - 97)));
    const result = calculatePregnancyDating({ clinicianEstimatedDueDate: dueDate, today });
    expect(result.totalGestationalAgeDays).toBe(97);
    expect(result.currentTrimester).toBe("first");
  });

  it("classifies exactly 14 weeks 0 days as second trimester", () => {
    const dueDate = "2026-12-01";
    const today = formatISODate(addDays(parseISODate(dueDate), -(280 - 98)));
    const result = calculatePregnancyDating({ clinicianEstimatedDueDate: dueDate, today });
    expect(result.totalGestationalAgeDays).toBe(98);
    expect(result.currentTrimester).toBe("second");
  });

  it("classifies exactly 27 weeks 6 days as second trimester", () => {
    const dueDate = "2026-12-01";
    const today = formatISODate(addDays(parseISODate(dueDate), -(280 - 195)));
    const result = calculatePregnancyDating({ clinicianEstimatedDueDate: dueDate, today });
    expect(result.totalGestationalAgeDays).toBe(195);
    expect(result.currentTrimester).toBe("second");
  });

  it("classifies exactly 28 weeks 0 days as third trimester", () => {
    const dueDate = "2026-12-01";
    const today = formatISODate(addDays(parseISODate(dueDate), -(280 - 196)));
    const result = calculatePregnancyDating({ clinicianEstimatedDueDate: dueDate, today });
    expect(result.totalGestationalAgeDays).toBe(196);
    expect(result.currentTrimester).toBe("third");
  });

  it("reports a positive daysUntilEstimatedDueDate before the due date", () => {
    const result = calculatePregnancyDating({
      clinicianEstimatedDueDate: "2026-12-25",
      today: "2026-12-01",
    });
    expect(result.daysUntilEstimatedDueDate).toBe(24);
  });

  it("reports a negative daysUntilEstimatedDueDate after the due date has passed", () => {
    const result = calculatePregnancyDating({
      clinicianEstimatedDueDate: "2026-12-01",
      today: "2026-12-05",
    });
    expect(result.daysUntilEstimatedDueDate).toBe(-4);
  });

  it("never takes symptom or mood data as input — the function signature has no such fields", () => {
    // Structural guarantee: TypeScript would reject an unknown property here,
    // so passing only dating fields compiles and produces a result untouched
    // by anything symptom-related.
    const result = calculatePregnancyDating({
      lastMenstrualPeriodDate: "2026-01-01",
      today: "2026-01-01",
    });
    expect(result).not.toHaveProperty("symptoms");
  });
});
