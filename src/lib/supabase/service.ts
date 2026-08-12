import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { supabaseUrl } from "./env";

/**
 * Bypasses Row Level Security entirely. Legitimate callers:
 * 1. The Stripe webhook route handler — a webhook delivery has no signed-in
 *    user session to scope a normal client to; every write it makes is on
 *    behalf of Stripe telling us the truth about a subscription.
 * 2. `src/lib/rate-limit/check.ts` — a user must never be able to read or
 *    clear their own rate-limit history, which a user-scoped/RLS'd client
 *    would allow.
 * 3. Admin server actions under `src/lib/admin/`, and only after an
 *    explicit `requireAdmin()` check has already verified the caller is a
 *    signed-in `is_admin` user — needed there because listing user emails
 *    requires the `auth.admin` API, which only the service role can call.
 * Never import this anywhere else. `SUPABASE_SERVICE_ROLE_KEY` must never be
 * exposed to the client (no `NEXT_PUBLIC_` prefix, never sent in a response).
 */
export function createServiceRoleClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Required for the Stripe webhook handler to write subscription updates.",
    );
  }

  return createSupabaseClient<Database>(supabaseUrl(), serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
