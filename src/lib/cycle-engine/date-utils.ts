/**
 * All cycle math happens in "epoch days" (whole days since the Unix epoch,
 * computed via Date.UTC) rather than with Date's local-time getters. That
 * sidesteps the entire class of timezone/DST bugs where a date string parsed
 * in one offset and read back in another silently shifts by a day — this
 * module never calls `.getDate()`/`.getMonth()` etc. on a `Date`, only
 * `Date.UTC` and `.getTime()`.
 */

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export class InvalidDateError extends Error {
  constructor(value: string) {
    super(`"${value}" is not a valid yyyy-mm-dd date.`);
    this.name = "InvalidDateError";
  }
}

/** Parses a strict yyyy-mm-dd string into whole days since the Unix epoch (UTC). */
export function parseISODate(value: string): number {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) throw new InvalidDateError(value);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utcMs = Date.UTC(year, month - 1, day);

  // Date.UTC normalizes out-of-range components (e.g. month 13, Feb 30)
  // instead of throwing, so round-trip and compare to catch that.
  const roundTrip = new Date(utcMs);
  if (
    roundTrip.getUTCFullYear() !== year ||
    roundTrip.getUTCMonth() !== month - 1 ||
    roundTrip.getUTCDate() !== day
  ) {
    throw new InvalidDateError(value);
  }

  return Math.round(utcMs / MS_PER_DAY);
}

/** Formats whole epoch days back into a yyyy-mm-dd string (UTC). */
export function formatISODate(epochDays: number): string {
  const date = new Date(epochDays * MS_PER_DAY);
  const year = date.getUTCFullYear().toString().padStart(4, "0");
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(epochDays: number, days: number): number {
  return epochDays + days;
}

/** a - b, in whole days. Positive when `a` is later than `b`. */
export function diffDays(a: number, b: number): number {
  return a - b;
}

/** Epoch-day representation of "now", in UTC — the only impure function here. */
export function todayEpochDays(): number {
  const now = new Date();
  return parseISODate(
    `${now.getUTCFullYear().toString().padStart(4, "0")}-${(now.getUTCMonth() + 1)
      .toString()
      .padStart(2, "0")}-${now.getUTCDate().toString().padStart(2, "0")}`,
  );
}
