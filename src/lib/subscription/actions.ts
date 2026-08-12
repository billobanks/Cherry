"use server";

import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import { getPremiumPriceId, getStripeClient } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import { FREE_SUBSCRIPTION_STATE } from "./types";
import type { SubscriptionState } from "./types";

async function getAppOrigin(): Promise<string> {
  const headersList = await headers();
  const host = headersList.get("host");
  if (!host) return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3410";
  const proto = headersList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export type GetSubscriptionStateResult =
  | { status: "ready"; state: SubscriptionState }
  | { status: "signed_out" };

export async function getSubscriptionState(): Promise<GetSubscriptionStateResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end, cancel_at_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return { status: "ready", state: FREE_SUBSCRIPTION_STATE };

  return {
    status: "ready",
    state: {
      plan: data.plan,
      status: data.status,
      currentPeriodEnd: data.current_period_end,
      cancelAtPeriodEnd: data.cancel_at_period_end,
    },
  };
}

export type CreateCheckoutSessionResult =
  | { status: "ready"; url: string }
  | { status: "signed_out" }
  | { status: "not_configured" }
  | { status: "rate_limited" }
  | { status: "error"; message: string };

export async function createCheckoutSession(): Promise<CreateCheckoutSessionResult> {
  const stripe = getStripeClient();
  const priceId = getPremiumPriceId();
  if (!stripe || !priceId) return { status: "not_configured" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const rateLimit = await checkRateLimit("checkoutSession", user.id);
  if (!rateLimit.allowed) return { status: "rate_limited" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, display_name")
    .eq("id", user.id)
    .single();

  let customerId = profile?.stripe_customer_id ?? null;

  if (!customerId) {
    try {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.display_name ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
    } catch {
      return { status: "error", message: "Couldn't start checkout — please try again." };
    }
  }

  const origin = await getAppOrigin();

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/settings/subscription?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=canceled`,
      client_reference_id: user.id,
    });

    if (!session.url) {
      return { status: "error", message: "Couldn't start checkout — please try again." };
    }
    return { status: "ready", url: session.url };
  } catch {
    return { status: "error", message: "Couldn't start checkout — please try again." };
  }
}

export type CreatePortalSessionResult =
  | { status: "ready"; url: string }
  | { status: "signed_out" }
  | { status: "not_configured" }
  | { status: "no_customer" }
  | { status: "rate_limited" }
  | { status: "error"; message: string };

export async function createPortalSession(): Promise<CreatePortalSessionResult> {
  const stripe = getStripeClient();
  if (!stripe) return { status: "not_configured" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const rateLimit = await checkRateLimit("portalSession", user.id);
  if (!rateLimit.allowed) return { status: "rate_limited" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) return { status: "no_customer" };

  const origin = await getAppOrigin();

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/settings/subscription`,
    });
    return { status: "ready", url: session.url };
  } catch {
    return { status: "error", message: "Couldn't open billing management — please try again." };
  }
}
