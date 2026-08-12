import type { RateLimitConfig, RateLimitDecision } from "./types";

/**
 * Pure sliding-window decision: given how many hits already landed inside
 * the current window, is one more allowed. Kept separate from the
 * Supabase-backed counting in `check.ts` so the actual policy logic is
 * unit-testable without a database.
 */
export function decideRateLimit(hitsInWindow: number, config: RateLimitConfig): RateLimitDecision {
  const allowed = hitsInWindow < config.limit;
  return {
    allowed,
    remaining: Math.max(0, config.limit - hitsInWindow - (allowed ? 1 : 0)),
    retryAfterSeconds: allowed ? null : config.windowSeconds,
  };
}
