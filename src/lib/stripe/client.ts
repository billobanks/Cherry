import Stripe from "stripe";

const STRIPE_API_VERSION = "2026-07-29.dahlia" as const;

/**
 * Server-only. Returns null (rather than throwing) when no secret key is
 * configured, so callers can show a clear "billing isn't set up yet" state
 * instead of a hard crash — same convention as `@/lib/assistant`'s provider
 * factory.
 */
export function getStripeClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION });
}

export function getPremiumPriceId(): string | null {
  return process.env.STRIPE_PREMIUM_PRICE_ID ?? null;
}
