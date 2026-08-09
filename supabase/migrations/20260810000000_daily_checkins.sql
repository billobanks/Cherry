-- Cherry — Daily wellness check-in
-- One row per user per day, fast to write, fast to edit.

-- A few symptoms in the check-in's fixed 12-item list aren't in the catalog yet.
insert into public.symptom_catalog (key, label, sort_order) values
  ('diarrhea', 'Diarrhea', 130),
  ('constipation', 'Constipation', 140),
  ('pelvic_discomfort', 'Pelvic discomfort', 150)
on conflict (key) do nothing;

create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  checkin_date date not null,
  flow text check (flow in ('none', 'spotting', 'light', 'medium', 'heavy')),
  mood text[] not null default '{}'
    check (mood <@ array[
      'happy', 'calm', 'anxious', 'irritable', 'sad', 'emotional', 'stressed'
    ]::text[]),
  energy_level smallint check (energy_level between 1 and 5),
  sleep_quality smallint check (sleep_quality between 1 and 5),
  discharge text
    check (discharge in ('none', 'spotting', 'sticky', 'creamy', 'watery', 'egg_white', 'unusual')),
  exercise text check (exercise in ('none', 'light', 'moderate', 'intense')),
  libido smallint check (libido between 1 and 5),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, checkin_date)
);

comment on table public.daily_checkins is
  'One row per user per calendar day. Every field is nullable/optional except the date — the check-in is designed to be logged in seconds with only what the user chooses to fill in.';

alter table public.daily_checkins enable row level security;

create policy "daily_checkins_all_own" on public.daily_checkins
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create trigger daily_checkins_set_updated_at
  before update on public.daily_checkins
  for each row execute function public.set_updated_at();

create index daily_checkins_user_date_idx
  on public.daily_checkins (user_id, checkin_date desc);

-- user_id is denormalized here (rather than joining through daily_checkins)
-- so the RLS policy is a cheap equality check, same pattern as
-- profile_common_symptoms.
create table public.checkin_symptoms (
  checkin_id uuid not null references public.daily_checkins (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  symptom_key text not null references public.symptom_catalog (key),
  primary key (checkin_id, symptom_key)
);

alter table public.checkin_symptoms enable row level security;

create policy "checkin_symptoms_all_own" on public.checkin_symptoms
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create index checkin_symptoms_user_idx on public.checkin_symptoms (user_id);
