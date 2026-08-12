import type { RateLimitConfig } from "./types";

/**
 * One named config per sensitive endpoint. Centralized so a limit can be
 * tuned in one place, and so it's obvious at a glance which endpoints are
 * covered — export/deletion (data-sensitive), checkout/portal (paid-API
 * cost), assistant messages (AI-API cost).
 */
export const RATE_LIMITS = {
  accountExport: { limit: 3, windowSeconds: 60 * 60 },
  accountDeletion: { limit: 3, windowSeconds: 60 * 60 * 24 },
  checkoutSession: { limit: 10, windowSeconds: 60 * 10 },
  portalSession: { limit: 10, windowSeconds: 60 * 10 },
  assistantMessage: { limit: 20, windowSeconds: 60 * 10 },
  pregnancyAssistantMessage: { limit: 20, windowSeconds: 60 * 10 },
  logIn: { limit: 10, windowSeconds: 60 * 10 },
} as const satisfies Record<string, RateLimitConfig>;

export type RateLimitedAction = keyof typeof RATE_LIMITS;
