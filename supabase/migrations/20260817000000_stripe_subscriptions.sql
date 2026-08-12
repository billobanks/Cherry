-- Cherry — Stripe subscriptions (Free / Premium)
-- Written and updated exclusively by the Stripe webhook handler using the
-- Supabase service-role key. There is deliberately no insert/update policy
-- for `authenticated` — a signed-in user can read their own row but can
-- never write to it, so premium access can't be granted by calling the
-- client directly. See src/lib/subscription/access.ts for the actual
-- entitlement check, which is always run server-side.

alter table public.profiles
  add column stripe_customer_id text unique;

comment on column public.profiles.stripe_customer_id is
  'Set once, the first time a user starts checkout. Looked up by the webhook handler to know which user a Stripe event belongs to.';

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text unique,
  plan text not null default 'free' check (plan in ('free', 'premium')),
  status text check (status in ('trialing', 'active', 'past_due', 'canceled', 'expired')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.subscriptions is
  'One row per user. plan/status/current_period_end drive premium feature access — never trust a cached or client-reported value, always re-check server-side via src/lib/subscription/access.ts.';

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own" on public.subscriptions
  for select to authenticated
  using (user_id = auth.uid());

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create index subscriptions_stripe_customer_idx on public.subscriptions (stripe_customer_id);

create table public.stripe_webhook_events (
  id text primary key,
  type text not null,
  processed_at timestamptz not null default now()
);

comment on table public.stripe_webhook_events is
  'Idempotency ledger: each Stripe event id is recorded once so a retried webhook delivery is skipped instead of reprocessed. Service-role only — no policies granted to `authenticated`.';

alter table public.stripe_webhook_events enable row level security;
