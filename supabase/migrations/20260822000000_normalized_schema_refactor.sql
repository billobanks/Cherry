-- Cherry — normalized schema refactor
--
-- Renames/restructures the existing menstrual-tracking core to match a
-- more conventionally normalized table set, and adds several genuinely new
-- tables. Scope is deliberately limited to the tables requested for this
-- refactor — pregnancy_*, safety_rules, rate_limit_hits,
-- account_deletion_log, and stripe_webhook_events are untouched, except
-- where they reference is_admin (see the admin_users section), since a
-- rename there would be unrequested, unrelated risk on a live database.
--
-- Every step here is data-preserving: renames instead of drop+create,
-- backfills instead of starting new tables empty where a real equivalent
-- already existed. Run top to bottom, in one transaction if your tooling
-- supports it (Supabase's SQL editor runs each statement individually, but
-- this file is written so a failure partway through leaves the database in
-- a coherent, resumable state — nothing here is destructive until the
-- explicit "drop column" steps, which only happen after the corresponding
-- backfill immediately above them).

-- =============================================================================
-- 1. RENAMES — table identity changes only, no data movement. Postgres
--    updates every foreign key, index, and RLS policy automatically since
--    they're tracked by object id, not by name.
-- =============================================================================

alter table public.cycles rename to menstrual_cycles;
alter index cycles_pkey rename to menstrual_cycles_pkey;
alter index cycles_user_id_start_date_idx rename to menstrual_cycles_user_id_start_date_idx;

alter table public.period_day_logs rename to period_logs;
alter index period_day_logs_pkey rename to period_logs_pkey;
alter index period_day_logs_user_id_log_date_key rename to period_logs_user_id_log_date_key;

alter table public.symptom_catalog rename to symptom_definitions;
alter index symptom_catalog_pkey rename to symptom_definitions_pkey;
alter index symptom_catalog_key_key rename to symptom_definitions_key_key;

alter table public.checkin_symptoms rename to symptom_logs;
alter table public.symptom_logs rename column checkin_id to daily_log_id;
alter index checkin_symptoms_pkey rename to symptom_logs_pkey;
alter index checkin_symptoms_user_idx rename to symptom_logs_user_idx;

alter table public.daily_checkins rename to daily_logs;
alter index daily_checkins_pkey rename to daily_logs_pkey;
alter index daily_checkins_user_date_idx rename to daily_logs_user_date_idx;
alter index daily_checkins_user_id_checkin_date_key rename to daily_logs_user_id_checkin_date_key;

comment on table public.menstrual_cycles is 'One row per menstrual cycle (logged or predicted). Renamed from cycles.';
comment on table public.period_logs is 'One row per logged period day. Renamed from period_day_logs.';
comment on table public.symptom_definitions is 'The symptom vocabulary (admin-managed lookup). Renamed from symptom_catalog.';
comment on table public.symptom_logs is 'Which symptoms were logged on which daily_logs row. Renamed from checkin_symptoms; checkin_id renamed to daily_log_id.';
comment on table public.daily_logs is 'One row per user per calendar day. Renamed from daily_checkins. mood/sleep_quality/energy_level have moved to mood_logs/sleep_logs/energy_logs — see below.';

-- =============================================================================
-- 2. EXTRACT mood_logs / sleep_logs / energy_logs out of daily_logs
--    daily_logs.mood was a text[] (a user can log more than one mood in a
--    day) — one mood_logs row per tag. sleep_quality/energy_level were
--    single nullable columns — one row per daily_logs entry that actually
--    set one, so an unset field simply has no row instead of a null one.
-- =============================================================================

create table public.mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  daily_log_id uuid not null references public.daily_logs (id) on delete cascade,
  mood_key text not null check (mood_key in (
    'happy', 'calm', 'anxious', 'irritable', 'sad', 'emotional', 'stressed'
  )),
  created_at timestamptz not null default now(),
  unique (daily_log_id, mood_key)
);

comment on table public.mood_logs is 'One row per mood tag per daily_logs entry — normalized out of daily_checkins.mood (was a text[]).';

alter table public.mood_logs enable row level security;

create policy "mood_logs_all_own" on public.mood_logs
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create index mood_logs_user_id_idx on public.mood_logs (user_id, created_at desc);
create index mood_logs_daily_log_id_idx on public.mood_logs (daily_log_id);

insert into public.mood_logs (user_id, daily_log_id, mood_key, created_at)
select dl.user_id, dl.id, m.mood_key, dl.created_at
from public.daily_logs dl
cross join lateral unnest(dl.mood) as m(mood_key)
where dl.mood is not null and array_length(dl.mood, 1) > 0;

alter table public.daily_logs drop column mood;

create table public.sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  daily_log_id uuid not null unique references public.daily_logs (id) on delete cascade,
  sleep_quality smallint not null check (sleep_quality between 1 and 5),
  created_at timestamptz not null default now()
);

comment on table public.sleep_logs is 'One row per daily_logs entry that recorded sleep quality — normalized out of daily_checkins.sleep_quality.';

alter table public.sleep_logs enable row level security;

create policy "sleep_logs_all_own" on public.sleep_logs
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create index sleep_logs_user_id_idx on public.sleep_logs (user_id, created_at desc);

insert into public.sleep_logs (user_id, daily_log_id, sleep_quality, created_at)
select user_id, id, sleep_quality, created_at
from public.daily_logs
where sleep_quality is not null;

alter table public.daily_logs drop column sleep_quality;

create table public.energy_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  daily_log_id uuid not null unique references public.daily_logs (id) on delete cascade,
  energy_level smallint not null check (energy_level between 1 and 5),
  created_at timestamptz not null default now()
);

comment on table public.energy_logs is 'One row per daily_logs entry that recorded energy level — normalized out of daily_checkins.energy_level.';

alter table public.energy_logs enable row level security;

create policy "energy_logs_all_own" on public.energy_logs
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create index energy_logs_user_id_idx on public.energy_logs (user_id, created_at desc);

insert into public.energy_logs (user_id, daily_log_id, energy_level, created_at)
select user_id, id, energy_level, created_at
from public.daily_logs
where energy_level is not null;

alter table public.daily_logs drop column energy_level;

-- =============================================================================
-- 3. user_preferences — extracted from profiles. Splits "who this person
--    is" (profiles) from "how the app should behave for them" (preferences),
--    which is the more normalized shape and matches how nutrition/movement/
--    privacy already treat these fields as a preferences concern.
-- =============================================================================

create table public.user_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  dietary_preference text not null default 'none'
    check (dietary_preference in ('none', 'vegetarian', 'vegan', 'pescatarian')),
  food_allergies text[] not null default '{}',
  foods_to_avoid text[] not null default '{}',
  workout_preferences text[] not null default '{}'
    check (workout_preferences <@ array[
      'walking', 'yoga', 'stretching', 'strength_training', 'pilates',
      'cycling', 'running', 'hiit', 'recovery_rest'
    ]::text[]),
  personalization_enabled boolean not null default true,
  fertility_tracking_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_preferences is 'One row per user. Extracted from profiles — dietary/workout/personalization/fertility-tracking settings, as opposed to identity fields.';

alter table public.user_preferences enable row level security;

create policy "user_preferences_all_own" on public.user_preferences
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create trigger user_preferences_set_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

insert into public.user_preferences (
  user_id, dietary_preference, food_allergies, foods_to_avoid,
  workout_preferences, personalization_enabled, fertility_tracking_enabled
)
select id, dietary_preference, food_allergies, foods_to_avoid,
       workout_preferences, personalization_enabled, fertility_tracking_enabled
from public.profiles;

alter table public.profiles
  drop column dietary_preference,
  drop column food_allergies,
  drop column foods_to_avoid,
  drop column workout_preferences,
  drop column personalization_enabled,
  drop column fertility_tracking_enabled;

-- =============================================================================
-- 4. user_goals — extracted from profiles.goals (was a text[]).
-- =============================================================================

create table public.user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  goal_key text not null check (goal_key in (
    'understand_cycle', 'predict_period', 'understand_pms',
    'improve_energy', 'improve_sleep', 'understand_mood',
    'nutrition_guidance', 'exercise_guidance', 'track_symptoms',
    'fertility_awareness'
  )),
  created_at timestamptz not null default now(),
  unique (user_id, goal_key)
);

comment on table public.user_goals is 'One row per goal a user selected — normalized out of profiles.goals (was a text[]).';

alter table public.user_goals enable row level security;

create policy "user_goals_all_own" on public.user_goals
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create index user_goals_user_id_idx on public.user_goals (user_id);

insert into public.user_goals (user_id, goal_key, created_at)
select p.id, g.goal_key, p.created_at
from public.profiles p
cross join lateral unnest(p.goals) as g(goal_key)
where p.goals is not null and array_length(p.goals, 1) > 0;

alter table public.profiles drop column goals;

-- =============================================================================
-- 5. admin_users — role-based, replacing the profiles.is_admin boolean.
--    Every existing policy that checked profiles.is_admin is redefined to
--    check admin_users instead — this is the one place the "untouched"
--    tables (safety_rules, pregnancy_week_content, pregnancy_safety_rules)
--    get touched, and only because they'd otherwise reference a column
--    that's about to stop existing.
-- =============================================================================

create table public.admin_users (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'moderator', 'support')),
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users (id) on delete set null
);

comment on table public.admin_users is 'Role-based admin access. Replaces profiles.is_admin. No self-serve promotion — inserted manually, same as is_admin was set manually.';

alter table public.admin_users enable row level security;

create policy "admin_users_select_own" on public.admin_users
  for select to authenticated
  using (user_id = auth.uid());

-- Only the 'admin' role can grant/revoke access — 'moderator'/'support'
-- pass the plain existence check other tables use (safety content, articles,
-- pregnancy content), but can't add or remove admin_users rows, including
-- their own.
create policy "admin_users_manage_admin" on public.admin_users
  for all to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid() and a.role = 'admin'))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid() and a.role = 'admin'));

insert into public.admin_users (user_id, role)
select id, 'admin' from public.profiles where is_admin = true;

-- Re-point every policy that referenced profiles.is_admin at admin_users.
drop policy if exists "safety_rules_admin_manage" on public.safety_rules;
create policy "safety_rules_admin_manage" on public.safety_rules
  for all to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "pregnancy_week_content_admin_manage" on public.pregnancy_week_content;
create policy "pregnancy_week_content_admin_manage" on public.pregnancy_week_content
  for all to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "pregnancy_safety_rules_admin_manage" on public.pregnancy_safety_rules;
create policy "pregnancy_safety_rules_admin_manage" on public.pregnancy_safety_rules
  for all to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

alter table public.profiles drop column is_admin;

-- =============================================================================
-- 6. cycle_predictions — a persisted snapshot of the prediction cycle-engine
--    computes. The app can (and does, for most reads) still compute this on
--    the fly; this table is for callers that want the latest stored
--    estimate without recomputing (e.g. a notification job) and for keeping
--    a history of how the estimate moved over time.
-- =============================================================================

create table public.cycle_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  predicted_period_start date not null,
  confidence text not null check (confidence in ('high', 'moderate', 'low')),
  current_phase text not null check (current_phase in ('menstrual', 'follicular', 'ovulation_window', 'luteal')),
  current_cycle_day smallint not null check (current_cycle_day > 0),
  computed_at timestamptz not null default now()
);

comment on table public.cycle_predictions is 'A persisted snapshot of a cycle-engine prediction. Estimates only — never a substitute for the live calculation in src/lib/cycle-engine, which remains the source of truth for what a user sees right now.';

alter table public.cycle_predictions enable row level security;

create policy "cycle_predictions_all_own" on public.cycle_predictions
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create index cycle_predictions_user_id_computed_at_idx on public.cycle_predictions (user_id, computed_at desc);

-- =============================================================================
-- 7. personalized_insights — a persisted snapshot of a generated daily body
--    insight. Distinct from daily_insight_feedback (which stores the user's
--    "does this sound like you?" answer about an insight, not the insight
--    itself).
-- =============================================================================

create table public.personalized_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  insight_date date not null,
  cycle_phase text not null check (cycle_phase in ('menstrual', 'follicular', 'ovulation_window', 'luteal')),
  headline text not null,
  sections jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, insight_date)
);

comment on table public.personalized_insights is 'A persisted snapshot of the day''s generated body-insight content (see src/lib/insights/generate.ts), so it can be re-displayed or referenced later without recomputation.';

alter table public.personalized_insights enable row level security;

create policy "personalized_insights_all_own" on public.personalized_insights
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create index personalized_insights_user_id_date_idx on public.personalized_insights (user_id, insight_date desc);

-- =============================================================================
-- 8. user_pattern_insights — a persisted snapshot of computed pattern
--    sentences (see src/lib/patterns/analyze.ts), refreshed each time "My
--    Patterns" is viewed rather than recomputed on every unrelated read.
-- =============================================================================

create table public.user_pattern_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  pattern_type text not null check (pattern_type in (
    'symptom_phase', 'mood_phase', 'craving_phase', 'energy_window', 'sleep_window'
  )),
  subject_key text,
  sentence text not null,
  occurrences smallint,
  eligible_cycles smallint,
  computed_at timestamptz not null default now()
);

comment on table public.user_pattern_insights is 'A persisted snapshot of a computed pattern sentence. subject_key holds the symptom/mood key the pattern is about, when applicable (null for energy/sleep window patterns, which aren''t about a specific key).';

alter table public.user_pattern_insights enable row level security;

create policy "user_pattern_insights_all_own" on public.user_pattern_insights
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create index user_pattern_insights_user_id_computed_at_idx on public.user_pattern_insights (user_id, computed_at desc);

-- =============================================================================
-- 9. content_articles / content_categories — general-purpose editorial
--    content, separate from pregnancy_week_content (which stays pregnancy-
--    specific and keeps its own governance workflow). Same DRAFT →
--    PUBLISHED discipline: unreviewed content is never selectable by a
--    non-admin.
-- =============================================================================

create table public.content_categories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  sort_order smallint not null default 0
);

comment on table public.content_categories is 'Editorial content categories (e.g. "Cycle basics", "Nutrition"). Admin-managed, publicly readable.';

alter table public.content_categories enable row level security;

create policy "content_categories_read_all" on public.content_categories
  for select to anon, authenticated using (true);

create policy "content_categories_admin_manage" on public.content_categories
  for all to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

create table public.content_articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.content_categories (id) on delete set null,
  slug text not null unique,
  title text not null,
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'in_review', 'published', 'archived')),
  source text,
  source_url text,
  medical_reviewer text,
  date_reviewed date,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.content_articles is 'General editorial articles. Only status = published rows are selectable by non-admins — enforced in the RLS policy itself, not just app code, same discipline as pregnancy_week_content.';

alter table public.content_articles enable row level security;

create policy "content_articles_read_published" on public.content_articles
  for select to anon, authenticated
  using (status = 'published');

create policy "content_articles_admin_manage" on public.content_articles
  for all to authenticated
  using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

create trigger content_articles_set_updated_at
  before update on public.content_articles
  for each row execute function public.set_updated_at();

create index content_articles_category_id_idx on public.content_articles (category_id);
create index content_articles_status_idx on public.content_articles (status);

-- =============================================================================
-- 10. subscription_events — an audit trail of subscription state changes,
--     distinct from stripe_webhook_events (which is a pure idempotency
--     ledger keyed by Stripe event id, not a readable history).
-- =============================================================================

create table public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  event_type text not null check (event_type in (
    'checkout_started', 'subscription_created', 'subscription_updated',
    'subscription_canceled', 'payment_failed', 'trial_ending'
  )),
  stripe_event_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.subscription_events is 'Readable audit trail of subscription lifecycle events, written alongside stripe_webhook_events (which only exists for idempotency and is service-role-only). Lets a user or admin see "what happened to my subscription and when."';

alter table public.subscription_events enable row level security;

create policy "subscription_events_select_own" on public.subscription_events
  for select to authenticated
  using (user_id = auth.uid());

create index subscription_events_user_id_created_at_idx on public.subscription_events (user_id, created_at desc);

-- =============================================================================
-- 11. ai_conversations / ai_messages — replaces the flat assistant_messages
--     table. The app's UX is still a single ongoing thread per user (no
--     conversation switcher), so a unique(user_id) constraint preserves
--     that today while making the schema ready for multiple threads later
--     without another migration — a caller would just need to drop the
--     uniqueness, not restructure anything.
-- =============================================================================

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.ai_conversations is 'One row per user''s ongoing chat thread with the AI assistant. unique(user_id) matches today''s single-thread UX; see comment above for how to extend it.';

alter table public.ai_conversations enable row level security;

create policy "ai_conversations_all_own" on public.ai_conversations
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create trigger ai_conversations_set_updated_at
  before update on public.ai_conversations
  for each row execute function public.set_updated_at();

insert into public.ai_conversations (user_id, created_at, updated_at)
select user_id, min(created_at), now()
from public.assistant_messages
group by user_id;

alter table public.assistant_messages rename to ai_messages;
alter table public.ai_messages add column conversation_id uuid references public.ai_conversations (id) on delete cascade;

update public.ai_messages m
set conversation_id = c.id
from public.ai_conversations c
where c.user_id = m.user_id;

alter table public.ai_messages alter column conversation_id set not null;

drop policy if exists "assistant_messages_all_own" on public.ai_messages;

alter table public.ai_messages drop column user_id;

create policy "ai_messages_all_own" on public.ai_messages
  for all to authenticated
  using (exists (select 1 from public.ai_conversations c where c.id = conversation_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.ai_conversations c where c.id = conversation_id and c.user_id = auth.uid()));

drop index if exists assistant_messages_user_created_idx;
create index ai_messages_conversation_id_created_at_idx on public.ai_messages (conversation_id, created_at);

comment on table public.ai_messages is 'One row per message. Renamed from assistant_messages; user_id replaced by conversation_id (join to ai_conversations for the owning user).';
