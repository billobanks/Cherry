import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { recordSubscriptionEvent } from "@/lib/repository/subscription-events";
import { getStripeClient } from "@/lib/stripe/client";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { deriveSubscriptionUpsert } from "@/lib/subscription";
import type { SubscriptionEventType } from "@/types/database";

/**
 * Stripe webhooks — never trust a client-reported subscription state, this
 * is the only place that's allowed to actually write one. Runs with the
 * Supabase service-role key (no user session exists for a server-to-server
 * webhook call) and every write goes through the same pure
 * `deriveSubscriptionUpsert` mapping that's unit tested in
 * src/lib/subscription/__tests__/webhook-events.test.ts.
 */

type SupabaseServiceClient = ReturnType<typeof createServiceRoleClient>;

async function upsertSubscriptionFromStripe(
  supabase: SupabaseServiceClient,
  subscription: Stripe.Subscription,
  eventType: SubscriptionEventType,
  stripeEventId: string,
): Promise<void> {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const periodEnd = subscription.items.data[0]?.current_period_end ?? null;

  const payload = deriveSubscriptionUpsert({
    id: subscription.id,
    customer: customerId,
    status: subscription.status,
    current_period_end: periodEnd,
    cancel_at_period_end: subscription.cancel_at_period_end,
  });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", payload.stripeCustomerId)
    .maybeSingle();

  if (!profile) {
    console.error("Stripe webhook: no profile found for customer", payload.stripeCustomerId);
    return;
  }

  const { data: subscriptionRow, error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: profile.id,
        stripe_customer_id: payload.stripeCustomerId,
        stripe_subscription_id: payload.stripeSubscriptionId,
        plan: payload.plan,
        status: payload.status,
        current_period_end: payload.currentPeriodEnd,
        cancel_at_period_end: payload.cancelAtPeriodEnd,
      },
      { onConflict: "user_id" },
    )
    .select("id")
    .single();

  if (error) {
    console.error("Stripe webhook: failed to upsert subscription", error);
    throw new Error("Failed to persist subscription update.");
  }

  const { error: eventError } = await recordSubscriptionEvent(supabase, {
    userId: profile.id,
    subscriptionId: subscriptionRow?.id ?? null,
    eventType,
    stripeEventId,
    payload: { status: payload.status, plan: payload.plan },
  });
  if (eventError) {
    console.error("Stripe webhook: failed to record subscription event", eventError);
  }
}

export async function POST(request: Request): Promise<Response> {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe isn't configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  // Signature verification needs the raw, unparsed body.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature.";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // Idempotency: Stripe retries deliveries, so a duplicate event id is
  // expected and should be a no-op, not reprocessed.
  const { error: recordError } = await supabase
    .from("stripe_webhook_events")
    .insert({ id: event.id, type: event.type });

  if (recordError) {
    if (recordError.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("Stripe webhook: failed to record event for idempotency", recordError);
    return NextResponse.json({ error: "Failed to record event." }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (typeof session.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await upsertSubscriptionFromStripe(supabase, subscription, "checkout_started", event.id);
        }
        break;
      }
      case "customer.subscription.created": {
        await upsertSubscriptionFromStripe(supabase, event.data.object, "subscription_created", event.id);
        break;
      }
      case "customer.subscription.updated": {
        await upsertSubscriptionFromStripe(supabase, event.data.object, "subscription_updated", event.id);
        break;
      }
      case "customer.subscription.deleted": {
        await upsertSubscriptionFromStripe(supabase, event.data.object, "subscription_canceled", event.id);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("Stripe webhook: failed to process event", event.type, err);
    return NextResponse.json({ error: "Failed to process event." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
