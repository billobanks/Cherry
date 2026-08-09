/**
 * Defaults and bounds intentionally mirror the DB check constraints on
 * `profiles.avg_cycle_length_days` / `avg_period_length_days`
 * (see supabase/migrations/20260808000000_onboarding.sql), duplicated here
 * rather than imported so the engine has zero dependency on any other
 * feature module.
 */

export const DEFAULT_CYCLE_LENGTH_DAYS = 28;
export const DEFAULT_PERIOD_LENGTH_DAYS = 5;

export const MIN_CYCLE_LENGTH_DAYS = 15;
export const MAX_CYCLE_LENGTH_DAYS = 60;
export const MIN_PERIOD_LENGTH_DAYS = 1;
export const MAX_PERIOD_LENGTH_DAYS = 14;

/**
 * The luteal phase (ovulation -> next period) is biologically far more
 * consistent than the follicular phase, so it's the standard anchor for
 * estimating ovulation day from cycle length: ovulation ≈ cycleLength - 14.
 */
export const LUTEAL_PHASE_LENGTH_DAYS = 14;

/** Estimated ovulation window = ovulation day ± this many days. */
export const OVULATION_WINDOW_RADIUS_DAYS = 2;

/** Minimum days of follicular/luteal runway kept on either side of the ovulation window. */
export const MIN_PHASE_BUFFER_DAYS = 2;

/**
 * How many completed cycles (start-date pairs) history needs to provide
 * before it's trusted to override a manually entered average.
 */
export const MIN_CYCLES_FOR_HISTORICAL_PRIORITY = 3;

/** History this deep (or deeper) is what "high confidence" data volume requires. */
export const ROBUST_HISTORY_CYCLE_COUNT = 5;

/** Cycle-length standard deviation thresholds (days) used to classify variability. */
export const REGULAR_STDDEV_THRESHOLD_DAYS = 2;
export const SOMEWHAT_IRREGULAR_STDDEV_THRESHOLD_DAYS = 5;

/** Default +/- range shown around the next-period estimate, keyed by variability. */
export const NEXT_PERIOD_RANGE_BY_VARIABILITY: Record<
  "regular" | "somewhat_irregular" | "irregular" | "not_sure",
  number
> = {
  regular: 2,
  somewhat_irregular: 4,
  irregular: 7,
  not_sure: 5,
};
