import { createServiceRoleClient } from "@/lib/supabase/service";
import { decideRateLimit } from "./decide";
import { RATE_LIMITS, type RateLimitedAction } from "./presets";
import type { RateLimitDecision } from "./types";

const OPEN_DECISION: RateLimitDecision = { allowed: true, remaining: Infinity, retryAfterSeconds: null };

/**
 * Server-only. Uses the service-role client deliberately — a user being
 * able to read or delete their own rate-limit history (which a
 * user-scoped/RLS'd client would allow if we granted it) would defeat the
 * point. Call this at the top of any sensitive server action, before doing
 * real work, keyed by `<action>:<userId>`.
 *
 * Fails open: rate limiting is defense-in-depth, not the primary guard on
 * any of these actions (auth, checkout, exports all have their own real
 * checks). If `SUPABASE_SERVICE_ROLE_KEY` is missing/misconfigured or the
 * rate-limit table is briefly unreachable, the caller should still work —
 * losing abuse protection is a much smaller problem than login, checkout,
 * or the assistant being completely down for every user.
 */
export async function checkRateLimit(action: RateLimitedAction, userId: string): Promise<RateLimitDecision> {
  try {
    const config = RATE_LIMITS[action];
    const bucketKey = `${action}:${userId}`;
    const windowStart = new Date(Date.now() - config.windowSeconds * 1000).toISOString();

    const supabase = createServiceRoleClient();

    const { count, error } = await supabase
      .from("rate_limit_hits")
      .select("id", { count: "exact", head: true })
      .eq("bucket_key", bucketKey)
      .gte("created_at", windowStart);

    if (error) {
      console.error(`checkRateLimit(${action}): couldn't read hit count, failing open:`, error.message);
      return OPEN_DECISION;
    }

    const decision = decideRateLimit(count ?? 0, config);

    if (decision.allowed) {
      await supabase.from("rate_limit_hits").insert({ bucket_key: bucketKey });
    }

    return decision;
  } catch (err) {
    console.error(`checkRateLimit(${action}): failing open —`, err);
    return OPEN_DECISION;
  }
}
