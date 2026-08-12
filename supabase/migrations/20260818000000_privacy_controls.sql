-- Cherry — privacy-first account and health-data controls
-- Three service-role-only tables (no policies granted to `authenticated` —
-- rate limiting and deletion auditing are internal bookkeeping, never
-- user-readable), one new profile preference, and a missing index found
-- during a full RLS/index audit of every existing table.

-- ---------------------------------------------------------------------------
-- Index audit: every other user-owned table already has an index (or a
-- unique constraint, which creates one) with user_id as its leading column.
-- `cycles` was the one gap — it's queried by user_id constantly (movement,
-- nutrition, patterns, the assistant, dashboard, calendar, safety).
-- ---------------------------------------------------------------------------
create index cycles_user_id_start_date_idx on public.cycles (user_id, start_date);

-- ---------------------------------------------------------------------------
-- personalization_enabled
-- When off, features that personalize using logged history (currently: the
-- AI assistant) fall back to generic, non-personalized guidance instead of
-- reading cycle phase / symptoms / mood / sleep / energy history.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column personalization_enabled boolean not null default true;

comment on column public.profiles.personalization_enabled is
  'Off = features that would otherwise use logged history to personalize (e.g. the AI assistant) fall back to generic guidance instead.';

-- ---------------------------------------------------------------------------
-- rate_limit_hits
-- A sliding-window counter: one row per request against a rate-limited
-- action. Checked and written exclusively via the service-role client (see
-- src/lib/rate-limit/) — never exposed to a user-scoped client, since a
-- user being able to read or clear their own rate-limit history would
-- defeat the point.
-- ---------------------------------------------------------------------------
create table public.rate_limit_hits (
  id uuid primary key default gen_random_uuid(),
  bucket_key text not null,
  created_at timestamptz not null default now()
);

comment on table public.rate_limit_hits is
  'Sliding-window rate limiting for sensitive endpoints (account export, account deletion, checkout/portal session creation, AI assistant messages). bucket_key is "<action>:<user_id>". Service-role only.';

alter table public.rate_limit_hits enable row level security;

create index rate_limit_hits_bucket_created_idx on public.rate_limit_hits (bucket_key, created_at);

-- ---------------------------------------------------------------------------
-- account_deletion_log
-- Proof that a deletion happened, kept independent of the user row it
-- describes (no foreign key — it must survive the user being deleted).
-- Deliberately minimal: a user id and a timestamp, nothing that could
-- itself be sensitive health data, so it can be retained for audit/legal
-- purposes without reintroducing the thing it's recording the deletion of.
-- ---------------------------------------------------------------------------
create table public.account_deletion_log (
  id uuid primary key default gen_random_uuid(),
  deleted_user_id uuid not null,
  deleted_at timestamptz not null default now()
);

comment on table public.account_deletion_log is
  'Audit trail for account deletions. No foreign key to profiles (must outlive the deleted row) and no personal data beyond the id — see src/lib/privacy/actions.ts for the deletion workflow. Service-role only.';

alter table public.account_deletion_log enable row level security;
