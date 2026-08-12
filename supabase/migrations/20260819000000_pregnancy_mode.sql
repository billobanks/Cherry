-- Cherry — Pregnancy Mode
-- A parallel tracking mode, not a replacement for the menstrual-cycle
-- tables. Activated by explicit user statement only ("I'm pregnant" / a
-- confirmed due date) — the app never infers pregnancy from cycle data.
-- Status enums are stored exactly as specified (upper snake case) rather
-- than this codebase's usual lower snake case, to match the product spec's
-- literal constant names one-to-one with the application code.

-- ---------------------------------------------------------------------------
-- pregnancies
-- One row per pregnancy. A user can have more than one over time (delivered
-- / ended pregnancies are kept, not deleted, unless the user deletes their
-- account or explicitly removes an entry).
-- ---------------------------------------------------------------------------
create table public.pregnancies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'PREGNANT'
    check (status in ('PREGNANT', 'DELIVERED', 'PREGNANCY_ENDED', 'ARCHIVED')),
  last_menstrual_period date,
  estimated_due_date date,
  due_date_source text
    check (due_date_source in ('LMP_ESTIMATE', 'ULTRASOUND', 'CLINICIAN', 'USER_ENTERED')),
  clinician_due_date date,
  ultrasound_due_date date,
  date_pregnancy_confirmed date,
  pregnancy_start_date date,
  delivery_date date,
  gestational_age_at_delivery_days smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.pregnancies is
  'One row per pregnancy. estimated_due_date is always app-labeled "Estimated" in the UI — see src/lib/pregnancy/dating-engine.ts, which never recomputes it from symptoms, only from LMP/ultrasound/clinician input, and prefers a clinician-provided date when present.';

alter table public.pregnancies enable row level security;

create policy "pregnancies_all_own" on public.pregnancies
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create trigger pregnancies_set_updated_at
  before update on public.pregnancies
  for each row execute function public.set_updated_at();

create index pregnancies_user_status_idx on public.pregnancies (user_id, status);

-- ---------------------------------------------------------------------------
-- pregnancy_profiles
-- The softer intake answers from activation — separate from the dating
-- fields on `pregnancies` since these are preferences, not calculations.
-- ---------------------------------------------------------------------------
create table public.pregnancy_profiles (
  id uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null unique references public.pregnancies (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  is_first_pregnancy boolean,
  has_scheduled_prenatal_care boolean,
  focus_areas text[] not null default '{}'
    check (focus_areas <@ array[
      'understanding_body', 'fetal_development', 'nutrition', 'managing_discomforts',
      'exercise_movement', 'sleep', 'emotional_wellbeing', 'appointments',
      'birth_preparation', 'baby_preparation', 'all'
    ]::text[]),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pregnancy_profiles enable row level security;

create policy "pregnancy_profiles_all_own" on public.pregnancy_profiles
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create trigger pregnancy_profiles_set_updated_at
  before update on public.pregnancy_profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- pregnancy_daily_logs / pregnancy_symptoms / pregnancy_moods
-- Same shape as the menstrual check-in: one log per day, symptoms and moods
-- as separate tagged tables so each entry can carry its own severity.
-- ---------------------------------------------------------------------------
create table public.pregnancy_daily_logs (
  id uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null references public.pregnancies (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  log_date date not null,
  energy_level smallint check (energy_level between 1 and 5),
  sleep_quality smallint check (sleep_quality between 1 and 5),
  hydration_level smallint check (hydration_level between 1 and 5),
  appetite_level smallint check (appetite_level between 1 and 5),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pregnancy_id, log_date)
);

alter table public.pregnancy_daily_logs enable row level security;

create policy "pregnancy_daily_logs_all_own" on public.pregnancy_daily_logs
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create trigger pregnancy_daily_logs_set_updated_at
  before update on public.pregnancy_daily_logs
  for each row execute function public.set_updated_at();

create index pregnancy_daily_logs_user_date_idx on public.pregnancy_daily_logs (user_id, log_date desc);
create index pregnancy_daily_logs_pregnancy_date_idx on public.pregnancy_daily_logs (pregnancy_id, log_date desc);

create table public.pregnancy_symptoms (
  id uuid primary key default gen_random_uuid(),
  daily_log_id uuid not null references public.pregnancy_daily_logs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  symptom_key text not null check (symptom_key in (
    'nausea', 'vomiting', 'headache', 'heartburn', 'constipation', 'bloating',
    'back_discomfort', 'pelvic_discomfort', 'cramping', 'breast_tenderness',
    'swelling', 'shortness_of_breath', 'vaginal_discharge', 'spotting_bleeding',
    'fetal_movement', 'contractions', 'fever', 'vision_changes', 'fluid_leaking', 'other'
  )),
  severity text check (severity in ('mild', 'moderate', 'severe')),
  created_at timestamptz not null default now()
);

alter table public.pregnancy_symptoms enable row level security;

create policy "pregnancy_symptoms_all_own" on public.pregnancy_symptoms
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create index pregnancy_symptoms_daily_log_idx on public.pregnancy_symptoms (daily_log_id);
create index pregnancy_symptoms_user_idx on public.pregnancy_symptoms (user_id);

create table public.pregnancy_moods (
  id uuid primary key default gen_random_uuid(),
  daily_log_id uuid not null references public.pregnancy_daily_logs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  mood_key text not null check (mood_key in (
    'happy', 'calm', 'anxious', 'irritable', 'sad', 'emotional', 'stressed'
  )),
  created_at timestamptz not null default now()
);

alter table public.pregnancy_moods enable row level security;

create policy "pregnancy_moods_all_own" on public.pregnancy_moods
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create index pregnancy_moods_daily_log_idx on public.pregnancy_moods (daily_log_id);
create index pregnancy_moods_user_idx on public.pregnancy_moods (user_id);

-- ---------------------------------------------------------------------------
-- pregnancy_nutrition_preferences
-- ---------------------------------------------------------------------------
create table public.pregnancy_nutrition_preferences (
  id uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null unique references public.pregnancies (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  dietary_preferences text[] not null default '{}'
    check (dietary_preferences <@ array[
      'vegetarian', 'vegan', 'pescatarian', 'gluten_free', 'dairy_free'
    ]::text[]),
  cultural_preferences text check (char_length(cultural_preferences) <= 500),
  food_allergies text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.pregnancy_nutrition_preferences enable row level security;

create policy "pregnancy_nutrition_preferences_all_own" on public.pregnancy_nutrition_preferences
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create trigger pregnancy_nutrition_preferences_set_updated_at
  before update on public.pregnancy_nutrition_preferences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- pregnancy_appointments / pregnancy_questions / pregnancy_notes
-- ---------------------------------------------------------------------------
create table public.pregnancy_appointments (
  id uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null references public.pregnancies (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  appointment_date date not null,
  appointment_time time,
  provider_name text check (char_length(provider_name) <= 200),
  location text check (char_length(location) <= 200),
  appointment_type text check (char_length(appointment_type) <= 100),
  reminder_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pregnancy_appointments enable row level security;

create policy "pregnancy_appointments_all_own" on public.pregnancy_appointments
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create trigger pregnancy_appointments_set_updated_at
  before update on public.pregnancy_appointments
  for each row execute function public.set_updated_at();

create index pregnancy_appointments_user_date_idx on public.pregnancy_appointments (user_id, appointment_date);
create index pregnancy_appointments_pregnancy_date_idx on public.pregnancy_appointments (pregnancy_id, appointment_date);

create table public.pregnancy_questions (
  id uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null references public.pregnancies (id) on delete cascade,
  appointment_id uuid references public.pregnancy_appointments (id) on delete set null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  question text not null check (char_length(question) <= 1000),
  answered boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.pregnancy_questions enable row level security;

create policy "pregnancy_questions_all_own" on public.pregnancy_questions
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create index pregnancy_questions_appointment_idx on public.pregnancy_questions (appointment_id);
create index pregnancy_questions_user_idx on public.pregnancy_questions (user_id);

create table public.pregnancy_notes (
  id uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null references public.pregnancies (id) on delete cascade,
  appointment_id uuid references public.pregnancy_appointments (id) on delete set null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  note text not null check (char_length(note) <= 4000),
  created_at timestamptz not null default now()
);

comment on table public.pregnancy_notes is
  'Free-text notes the user writes themselves (e.g. "from my visit"). Never system-generated interpretation of lab or imaging results — see the app-level rule that result uploads require a separate, explicitly medically reviewed feature before they can exist at all.';

alter table public.pregnancy_notes enable row level security;

create policy "pregnancy_notes_all_own" on public.pregnancy_notes
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create index pregnancy_notes_appointment_idx on public.pregnancy_notes (appointment_id);
create index pregnancy_notes_user_idx on public.pregnancy_notes (user_id);

-- ---------------------------------------------------------------------------
-- pregnancy_week_content
-- Admin-governed, medically reviewed educational content. The workflow
-- status gates visibility: src/lib/pregnancy/week-content-actions.ts only
-- ever selects status = 'PUBLISHED' for end users. Nothing else in the
-- app is allowed to read draft/unreviewed rows.
-- ---------------------------------------------------------------------------
create table public.pregnancy_week_content (
  id uuid primary key default gen_random_uuid(),
  week_number smallint not null check (week_number between 4 and 42),
  section text not null check (section in (
    'baby_development', 'body_changes', 'what_you_may_notice', 'nutrition',
    'movement', 'self_care', 'questions_for_provider', 'coming_up'
  )),
  content text not null,
  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'MEDICAL_REVIEW', 'APPROVED', 'PUBLISHED', 'RETIRED')),
  source text,
  source_url text,
  medical_reviewer text,
  date_reviewed date,
  content_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (week_number, section)
);

comment on table public.pregnancy_week_content is
  'One row per (week, section). Never appears to end users unless status = PUBLISHED. Managed from /admin/pregnancy-content — see src/lib/pregnancy/admin-content-actions.ts.';

alter table public.pregnancy_week_content enable row level security;

create policy "pregnancy_week_content_read_published" on public.pregnancy_week_content
  for select to authenticated
  using (status = 'PUBLISHED');

create policy "pregnancy_week_content_admin_manage" on public.pregnancy_week_content
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

create trigger pregnancy_week_content_set_updated_at
  before update on public.pregnancy_week_content
  for each row execute function public.set_updated_at();

create index pregnancy_week_content_week_idx on public.pregnancy_week_content (week_number, status);

-- ---------------------------------------------------------------------------
-- pregnancy_safety_rules
-- Same architecture as the menstrual-cycle `safety_rules` table: code
-- decides WHEN a rule fires (src/lib/pregnancy/safety-engine.ts), this
-- table only holds WHAT gets said, its urgency, and whether it's active.
-- ---------------------------------------------------------------------------
create table public.pregnancy_safety_rules (
  rule_key text primary key check (rule_key in (
    'heavy_bleeding',
    'severe_abdominal_pain',
    'severe_headache_with_vision_changes',
    'reduced_fetal_movement',
    'signs_of_preterm_labor',
    'severe_swelling_with_headache',
    'fever',
    'severe_vomiting_unable_to_keep_fluids',
    'fluid_leaking'
  )),
  label text not null,
  description text not null,
  severity text not null default 'routine' check (severity in ('routine', 'urgent')),
  message text not null,
  active boolean not null default true,
  params jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

alter table public.pregnancy_safety_rules enable row level security;

create policy "pregnancy_safety_rules_read_active" on public.pregnancy_safety_rules
  for select to authenticated
  using (active = true);

create policy "pregnancy_safety_rules_admin_manage" on public.pregnancy_safety_rules
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

create trigger pregnancy_safety_rules_set_updated_at
  before update on public.pregnancy_safety_rules
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- pregnancy_insights
-- A lightweight daily snapshot (gestational age / trimester at the time of
-- that day's log) so "My Pregnancy Patterns" can trend over time without
-- recomputing history from scratch on every read.
-- ---------------------------------------------------------------------------
create table public.pregnancy_insights (
  id uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null references public.pregnancies (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  log_date date not null,
  gestational_age_days smallint not null,
  trimester text not null check (trimester in ('first', 'second', 'third')),
  created_at timestamptz not null default now(),
  unique (pregnancy_id, log_date)
);

alter table public.pregnancy_insights enable row level security;

create policy "pregnancy_insights_all_own" on public.pregnancy_insights
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create index pregnancy_insights_user_date_idx on public.pregnancy_insights (user_id, log_date);

-- ---------------------------------------------------------------------------
-- pregnancy_notifications
-- Same opt-in-only pattern as `notification_preferences`, plus the privacy
-- preview level this mode explicitly requires: previews default to the
-- private, non-detailed option.
-- ---------------------------------------------------------------------------
create table public.pregnancy_notifications (
  user_id uuid not null references public.profiles (id) on delete cascade,
  category text not null check (category in (
    'weekly_milestone', 'appointment_reminder', 'daily_checkin_reminder', 'safety_follow_up'
  )),
  enabled boolean not null default false,
  preview_detail text not null default 'private' check (preview_detail in ('private', 'detailed')),
  updated_at timestamptz not null default now(),
  primary key (user_id, category)
);

comment on column public.pregnancy_notifications.preview_detail is
  'Controls whether a push/notification preview may show pregnancy specifics (e.g. "You''re 22 weeks today") or must stay generic ("You have a new update"). Defaults to private — detailed previews are opt-in only.';

alter table public.pregnancy_notifications enable row level security;

create policy "pregnancy_notifications_all_own" on public.pregnancy_notifications
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- pregnancy_birth_preferences
-- ---------------------------------------------------------------------------
create table public.pregnancy_birth_preferences (
  id uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null unique references public.pregnancies (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  notes text check (char_length(notes) <= 4000),
  updated_at timestamptz not null default now()
);

comment on column public.pregnancy_birth_preferences.preferences is
  'Freeform structured birth-plan preferences (pain management, support people, environment, etc.) — deliberately jsonb since these vary widely and the app must not prescribe a template.';

alter table public.pregnancy_birth_preferences enable row level security;

create policy "pregnancy_birth_preferences_all_own" on public.pregnancy_birth_preferences
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create trigger pregnancy_birth_preferences_set_updated_at
  before update on public.pregnancy_birth_preferences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- contraction_logs
-- ---------------------------------------------------------------------------
create table public.contraction_logs (
  id uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null references public.pregnancies (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  intensity text check (intensity in ('mild', 'moderate', 'strong')),
  created_at timestamptz not null default now()
);

comment on table public.contraction_logs is
  'Logging only — duration and interval are computed at read time (src/lib/pregnancy/contraction-engine.ts), not stored, since ended_at can be added after the fact. The app never classifies whether labor is safe to manage at home; it only helps track timing to discuss with a provider or bring to a hospital.';

alter table public.contraction_logs enable row level security;

create policy "contraction_logs_all_own" on public.contraction_logs
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create index contraction_logs_pregnancy_started_idx on public.contraction_logs (pregnancy_id, started_at desc);

-- ---------------------------------------------------------------------------
-- delivery_records
-- ---------------------------------------------------------------------------
create table public.delivery_records (
  id uuid primary key default gen_random_uuid(),
  pregnancy_id uuid not null unique references public.pregnancies (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  delivery_date date not null,
  delivery_time time,
  delivery_type text check (delivery_type in ('vaginal', 'cesarean', 'other')),
  location text check (char_length(location) <= 200),
  notes text check (char_length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.delivery_records is
  'A record the user logs themselves — never a clinical determination made by the app.';

alter table public.delivery_records enable row level security;

create policy "delivery_records_all_own" on public.delivery_records
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- pregnancy_safety_rules seed data
-- Educational, non-diagnostic context only — the escalation call-to-action
-- is appended by application code based on severity, exactly like the
-- menstrual safety_rules table.
-- ---------------------------------------------------------------------------
insert into public.pregnancy_safety_rules (rule_key, label, description, severity, message) values
  (
    'heavy_bleeding',
    'Heavy vaginal bleeding',
    'Fires when bleeding heavier than spotting is logged.',
    'urgent',
    'Bleeding that''s heavier than spotting during pregnancy can have several possible causes.'
  ),
  (
    'severe_abdominal_pain',
    'Severe abdominal pain',
    'Fires when abdominal/cramping pain is logged at severe intensity.',
    'urgent',
    'Sudden or severe abdominal pain during pregnancy can have several possible causes.'
  ),
  (
    'severe_headache_with_vision_changes',
    'Severe headache with vision changes',
    'Fires when a severe headache is logged alongside a note of vision changes.',
    'urgent',
    'A severe headache along with vision changes such as blurring, spots, or flashing can have several possible causes during pregnancy.'
  ),
  (
    'reduced_fetal_movement',
    'Reduced fetal movement',
    'Fires when reduced or absent fetal movement is logged during a gestational window where movement is typically established.',
    'urgent',
    'A noticeable decrease in your baby''s usual movement pattern can have several possible causes.'
  ),
  (
    'signs_of_preterm_labor',
    'Possible signs of preterm labor',
    'Fires when regular contractions, pelvic pressure, or fluid leaking are logged before 37 weeks gestation.',
    'urgent',
    'Regular contractions, pelvic pressure, or fluid leaking before 37 weeks can have several possible causes.'
  ),
  (
    'severe_swelling_with_headache',
    'Severe swelling with headache',
    'Fires when sudden or severe swelling is logged alongside a headache.',
    'urgent',
    'Sudden or severe swelling in your face or hands, especially along with a headache, can have several possible causes during pregnancy.'
  ),
  (
    'fever',
    'Fever',
    'Fires when fever is logged as a symptom.',
    'urgent',
    'A fever during pregnancy can have several possible causes.'
  ),
  (
    'severe_vomiting_unable_to_keep_fluids',
    'Severe vomiting, unable to keep fluids down',
    'Fires when vomiting is logged at severe intensity.',
    'urgent',
    'Vomiting severe enough that you can''t keep fluids down can have several possible causes and can affect hydration.'
  ),
  (
    'fluid_leaking',
    'Fluid leaking',
    'Fires when fluid leaking is logged as a symptom.',
    'urgent',
    'Fluid leaking during pregnancy can have several possible causes.'
  );
