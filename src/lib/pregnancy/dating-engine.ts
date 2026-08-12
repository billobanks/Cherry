import { addDays, diffDays, formatISODate, parseISODate, todayEpochDays } from "@/lib/cycle-engine";
import type { DueDateSource, Trimester } from "@/types/database";

export class PregnancyDatingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PregnancyDatingError";
  }
}

/** Naegele's rule: full term is 280 days (40 weeks) from the last menstrual period. */
const GESTATION_DAYS = 280;
/** 13 weeks + 6 days, inclusive. */
const FIRST_TRIMESTER_END_DAYS = 13 * 7 + 6;
/** 27 weeks + 6 days, inclusive. */
const SECOND_TRIMESTER_END_DAYS = 27 * 7 + 6;

export interface PregnancyDatingInput {
  lastMenstrualPeriodDate?: string | null;
  clinicianEstimatedDueDate?: string | null;
  ultrasoundEstimatedDueDate?: string | null;
  /** A due date the user was told through some other channel and entered directly. */
  userEnteredDueDate?: string | null;
  datePregnancyConfirmed?: string | null;
  /** Injectable "today", for deterministic calculation and testing. Defaults to the real current date (UTC). */
  today?: string;
}

export interface PregnancyDatingResult {
  /** Always app-labeled "Estimated" in the UI — never presented as a guarantee. */
  estimatedDueDate: string;
  dueDateSource: DueDateSource;
  gestationalAgeWeeks: number;
  /** Remainder days within the current week (0-6). */
  gestationalAgeDays: number;
  totalGestationalAgeDays: number;
  currentTrimester: Trimester;
  /** Positive if the due date is in the future, negative if past it. */
  daysUntilEstimatedDueDate: number;
}

function classifyTrimester(totalGestationalAgeDays: number): Trimester {
  if (totalGestationalAgeDays <= FIRST_TRIMESTER_END_DAYS) return "first";
  if (totalGestationalAgeDays <= SECOND_TRIMESTER_END_DAYS) return "second";
  return "third";
}

/**
 * Deterministic pregnancy dating only — no AI, no drift from logged
 * symptoms. A clinician-provided due date always wins when present (the
 * "primary pregnancy timeline" the product spec requires); ultrasound is
 * next, then the LMP-based estimate (Naegele's rule), then whatever the
 * user entered directly with no other source available. Gestational age is
 * always derived by working backward from whichever due date won, so the
 * displayed week/day and the due date can never silently disagree with
 * each other.
 */
export function calculatePregnancyDating(input: PregnancyDatingInput): PregnancyDatingResult {
  let estimatedDueDate: string;
  let dueDateSource: DueDateSource;

  if (input.clinicianEstimatedDueDate) {
    estimatedDueDate = input.clinicianEstimatedDueDate;
    dueDateSource = "CLINICIAN";
  } else if (input.ultrasoundEstimatedDueDate) {
    estimatedDueDate = input.ultrasoundEstimatedDueDate;
    dueDateSource = "ULTRASOUND";
  } else if (input.lastMenstrualPeriodDate) {
    estimatedDueDate = formatISODate(addDays(parseISODate(input.lastMenstrualPeriodDate), GESTATION_DAYS));
    dueDateSource = "LMP_ESTIMATE";
  } else if (input.userEnteredDueDate) {
    estimatedDueDate = input.userEnteredDueDate;
    dueDateSource = "USER_ENTERED";
  } else {
    throw new PregnancyDatingError(
      "At least one of lastMenstrualPeriodDate, clinicianEstimatedDueDate, ultrasoundEstimatedDueDate, or userEnteredDueDate is required.",
    );
  }

  const todayEpoch = input.today ? parseISODate(input.today) : todayEpochDays();
  const dueDateEpoch = parseISODate(estimatedDueDate);
  const effectiveLmpEpoch = addDays(dueDateEpoch, -GESTATION_DAYS);

  const totalGestationalAgeDays = Math.max(0, diffDays(todayEpoch, effectiveLmpEpoch));
  const gestationalAgeWeeks = Math.floor(totalGestationalAgeDays / 7);
  const gestationalAgeDays = totalGestationalAgeDays % 7;

  return {
    estimatedDueDate,
    dueDateSource,
    gestationalAgeWeeks,
    gestationalAgeDays,
    totalGestationalAgeDays,
    currentTrimester: classifyTrimester(totalGestationalAgeDays),
    daysUntilEstimatedDueDate: diffDays(dueDateEpoch, todayEpoch),
  };
}
