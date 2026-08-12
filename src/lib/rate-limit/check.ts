import { createServiceRoleClient } from "@/lib/supabase/service";
import { decideRateLimit } from "./decide";
import { RATE_LIMITS, type RateLimitedAction } from "./presets";
import type { RateLimitDecision } from "./types";

/**
 * Server-only. Uses the service-role client deliberately — a user being
 * able to read or delete their own rate-limit history (which a
 * user-scoped/RLS'd client would allow if we granted it) would defeat the
 * point. Call this at the top of any sensitive server action, before doing
 * real work, keyed by `<action>:<userId>`.
 */
export async function checkRateLimit(action: RateLimitedAction, userId: string): Promise<RateLimitDecision> {
  const config = RATE_LIMITS[action];
  const bucketKey = `${action}:${userId}`;
  const windowStart = new Date(Date.now() - config.windowSeconds * 1000).toISOString();

  const supabase = createServiceRoleClient();

  const { count } = await supabase
    .from("rate_limit_hits")
    .select("id", { count: "exact", head: true })
    .eq("bucket_key", bucketKey)
    .gte("created_at", windowStart);

  const decision = decideRateLimit(count ?? 0, config);

  if (decision.allowed) {
    await supabase.from("rate_limit_hits").insert({ bucket_key: bucketKey });
  }

  return decision;
}
