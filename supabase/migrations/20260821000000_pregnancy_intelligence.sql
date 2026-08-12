-- Cherry — Pregnancy Week Intelligence Engine
-- Adds the supporting tables for: the Newly Pregnant Checklist, the
-- weekly "Welcome to Week X" save/share flow, and a dedicated pregnancy AI
-- assistant thread (kept separate from the menstrual `assistant_messages`
-- table since the two use different system prompts and safety engines).

-- ---------------------------------------------------------------------------
-- pregnancy_profiles.last_seen_gestational_week
-- Lets the app show the weekly welcome screen exactly once per new week,
-- without needing a separate table just to track a single integer.
-- ---------------------------------------------------------------------------
alter table public.pregnancy_profiles
  add column last_seen_gestational_week smallint;

-- ---------------------------------------------------------------------------
-- pregnancy_checklist_items
-- Completion state for the "Newly Pregnant Checklist" (first-trimester
-- onboarding tasks like "schedule prenatal care"). The checklist content
-- itself (labels, ordering) is static app content, not stored here — this
-- table only tracks which item keys a user has checked off.
-- ---------------------------------------------------------------------------
create table public.pregnancy_checklist_items (
  id uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null references public.pregnancies (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_key text not null check (item_key in (
    'schedule_prenatal_care', 'review_medications_with_clinician', 'review_prenatal_nutrition',
    'review_food_safety', 'record_clinician_due_date', 'prepare_first_appointment_questions'
  )),
  completed_at timestamptz not null default now(),
  unique (pregnancy_id, item_key)
);

alter table public.pregnancy_checklist_items enable row level security;

create policy "pregnancy_checklist_items_all_own" on public.pregnancy_checklist_items
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create index pregnancy_checklist_items_pregnancy_idx on public.pregnancy_checklist_items (pregnancy_id);

-- ---------------------------------------------------------------------------
-- pregnancy_saved_weeks
-- "Save" on the weekly welcome screen — just a bookmark of which week
-- summaries a user wanted to keep. No content duplicated here; the week
-- summary is always re-composed live from published content + the engine.
-- ---------------------------------------------------------------------------
create table public.pregnancy_saved_weeks (
  id uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null references public.pregnancies (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_number smallint not null check (week_number between 1 and 42),
  saved_at timestamptz not null default now(),
  unique (pregnancy_id, week_number)
);

alter table public.pregnancy_saved_weeks enable row level security;

create policy "pregnancy_saved_weeks_all_own" on public.pregnancy_saved_weeks
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create index pregnancy_saved_weeks_pregnancy_idx on public.pregnancy_saved_weeks (pregnancy_id);

-- ---------------------------------------------------------------------------
-- pregnancy_assistant_messages
-- Same one-thread-per-user shape as `assistant_messages`, kept as a
-- separate table (not a shared `domain` column) because the pregnancy
-- assistant's system prompt, context assembly, and safety engine
-- (PregnancySafetyEngine, not the menstrual SafetyEngine) are entirely
-- distinct code paths — see src/lib/pregnancy/assistant/.
-- ---------------------------------------------------------------------------
create table public.pregnancy_assistant_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) <= 4000),
  created_at timestamptz not null default now()
);

comment on table public.pregnancy_assistant_messages is
  'A single ongoing chat thread per user with the pregnancy AI assistant. Education only, gated by PregnancySafetyEngine before every reply — see src/lib/pregnancy/assistant/.';

alter table public.pregnancy_assistant_messages enable row level security;

create policy "pregnancy_assistant_messages_all_own" on public.pregnancy_assistant_messages
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create index pregnancy_assistant_messages_user_created_idx
  on public.pregnancy_assistant_messages (user_id, created_at);
