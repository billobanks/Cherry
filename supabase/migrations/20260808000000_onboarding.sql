-- Cherry — onboarding schema
-- Scope: only the tables the onboarding flow reads from or writes to.
-- (Daily check-ins, content, subscriptions, admin, etc. are separate migrations,
-- see the architecture proposal for the full schema.)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- One row per auth.users row, created automatically by the trigger below.
-- Onboarding fills most of this in via an UPDATE once the account exists.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  primary_focus text
    check (primary_focus in (
      'track_cycle', 'understand_symptoms', 'energy_sleep_mood',
      'fertility_awareness', 'exploring'
    )),
  last_period_start_date date,
  avg_cycle_length_days smallint
    check (avg_cycle_length_days between 15 and 60),
  avg_period_length_days smallint
    check (avg_period_length_days between 1 and 14),
  cycle_regularity text
    check (cycle_regularity in (
      'regular', 'somewhat_irregular', 'irregular', 'not_sure'
    )),
  goals text[] not null default '{}'
    check (goals <@ array[
      'understand_cycle', 'predict_period', 'understand_pms',
      'improve_energy', 'improve_sleep', 'understand_mood',
      'nutrition_guidance', 'exercise_guidance', 'track_symptoms',
      'fertility_awareness'
    ]::text[]),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'One row per user. Onboarding writes here after account creation; birth date and other sensitive fields are intentionally not collected during onboarding.';

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Auto-create a profile row the moment an auth user is created, so onboarding
-- can UPDATE it instead of racing an INSERT against RLS.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- symptom_catalog
-- Admin-managed lookup, but readable pre-auth: the onboarding symptom-picker
-- step (screen 7) runs before the account exists.
-- ---------------------------------------------------------------------------
create table public.symptom_catalog (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  sort_order smallint not null default 0,
  is_active boolean not null default true
);

alter table public.symptom_catalog enable row level security;

create policy "symptom_catalog_read_active" on public.symptom_catalog
  for select to anon, authenticated using (is_active = true);

insert into public.symptom_catalog (key, label, sort_order) values
  ('cramps', 'Cramps', 10),
  ('bloating', 'Bloating', 20),
  ('fatigue', 'Fatigue', 30),
  ('headache', 'Headache', 40),
  ('breast_tenderness', 'Breast tenderness', 50),
  ('mood_swings', 'Mood swings', 60),
  ('acne', 'Acne', 70),
  ('backache', 'Backache', 80),
  ('food_cravings', 'Food cravings', 90),
  ('insomnia', 'Trouble sleeping', 100),
  ('nausea', 'Nausea', 110),
  ('hot_flashes', 'Hot flashes', 120);

-- ---------------------------------------------------------------------------
-- profile_common_symptoms
-- The baseline symptoms picked in onboarding (screen 7), seeds personalization
-- before any daily check-in exists.
-- ---------------------------------------------------------------------------
create table public.profile_common_symptoms (
  user_id uuid not null references public.profiles (id) on delete cascade,
  symptom_key text not null references public.symptom_catalog (key),
  created_at timestamptz not null default now(),
  primary key (user_id, symptom_key)
);

alter table public.profile_common_symptoms enable row level security;

create policy "profile_common_symptoms_all_own" on public.profile_common_symptoms
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- cycles / period_day_logs
-- Seeded once, optionally, from the "last period start date" onboarding step.
-- ---------------------------------------------------------------------------
create table public.cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  start_date date not null,
  end_date date,
  cycle_length_days smallint,
  period_length_days smallint,
  source text not null default 'logged' check (source in ('logged', 'predicted')),
  created_at timestamptz not null default now()
);

alter table public.cycles enable row level security;

create policy "cycles_all_own" on public.cycles
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.period_day_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  cycle_id uuid references public.cycles (id) on delete set null,
  log_date date not null,
  flow_intensity text check (flow_intensity in ('spotting', 'light', 'medium', 'heavy')),
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

alter table public.period_day_logs enable row level security;

create policy "period_day_logs_all_own" on public.period_day_logs
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- notification_preferences
-- Set from the onboarding notifications step (screen 9). All opt-in.
-- ---------------------------------------------------------------------------
create table public.notification_preferences (
  user_id uuid not null references public.profiles (id) on delete cascade,
  channel text not null check (channel in ('email', 'push')),
  category text not null check (category in (
    'daily_checkin_reminder', 'period_prediction', 'insight_digest', 'product_updates'
  )),
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, channel, category)
);

alter table public.notification_preferences enable row level security;

create policy "notification_preferences_all_own" on public.notification_preferences
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
