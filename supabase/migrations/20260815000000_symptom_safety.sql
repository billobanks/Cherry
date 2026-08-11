-- Cherry — Symptom safety & escalation system
-- Deliberately separate from the phase/nutrition/movement content engines:
-- this is medically reviewed copy that can be edited independently, from
-- /admin/safety-rules, without touching application code. The app never
-- diagnoses — every rule's message frames things as "can have several
-- possible causes" and points toward professional evaluation.

alter table public.profiles
  add column is_admin boolean not null default false;

comment on column public.profiles.is_admin is
  'Grants access to /admin routes (e.g. safety rule management). Set manually — no self-serve promotion.';

insert into public.symptom_catalog (key, label, sort_order) values
  ('dizziness', 'Dizziness', 160),
  ('fainting', 'Fainting', 170)
on conflict (key) do nothing;

alter table public.daily_checkins
  add column pain_severity smallint check (pain_severity between 1 and 5);

comment on column public.daily_checkins.pain_severity is
  '1 (none/minimal) to 5 (severe) — feeds the symptom safety engine alongside flow and symptoms.';

create table public.safety_rules (
  rule_key text primary key check (rule_key in (
    'heavy_bleeding',
    'severe_or_worsening_pain',
    'fainting',
    'dizziness_with_heavy_bleeding',
    'unusual_bleeding_pattern',
    'prolonged_bleeding'
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

comment on table public.safety_rules is
  'Medically reviewed symptom-safety copy, managed from /admin/safety-rules. Kept separate from the phase/nutrition/movement content engines so it can be reviewed and updated independently of app code. WHEN a rule fires is decided by src/lib/safety/evaluate.ts; this table only holds WHAT gets said and whether it is active.';
comment on column public.safety_rules.message is
  'The explanatory, non-diagnostic context sentence shown to the user. The call-to-action ("consider contacting a healthcare professional" / "seek timely medical care") is appended by the app based on severity, not stored here, so it can never be edited away by mistake.';
comment on column public.safety_rules.params is
  'Optional per-rule tunable thresholds, e.g. {"thresholdDays": 8} for prolonged_bleeding.';

alter table public.safety_rules enable row level security;

create policy "safety_rules_read_active" on public.safety_rules
  for select to authenticated
  using (active = true);

create policy "safety_rules_admin_manage" on public.safety_rules
  for all to authenticated
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true
  ))
  with check (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true
  ));

create trigger safety_rules_set_updated_at
  before update on public.safety_rules
  for each row execute function public.set_updated_at();

insert into public.safety_rules (rule_key, label, description, severity, message, params) values
  (
    'heavy_bleeding',
    'Unusually heavy bleeding',
    'Fires when today''s logged flow is "heavy".',
    'routine',
    'Bleeding that''s heavier than what''s typical for you can have several possible causes.',
    '{}'
  ),
  (
    'severe_or_worsening_pain',
    'Severe or rapidly worsening pain',
    'Fires when logged pain severity is at the top of the scale, or has jumped sharply since the previous day''s check-in.',
    'urgent',
    'Pain that''s severe, or that''s getting noticeably worse quickly, can have several possible causes and is more than typical cycle discomfort.',
    '{}'
  ),
  (
    'fainting',
    'Fainting',
    'Fires when "fainting" is logged as a symptom for the day.',
    'urgent',
    'Fainting, or feeling like you might faint, can have several possible causes, and some warrant prompt attention.',
    '{}'
  ),
  (
    'dizziness_with_heavy_bleeding',
    'Dizziness with heavy bleeding',
    'Fires when "dizziness" is logged alongside a "heavy" flow on the same day.',
    'urgent',
    'Feeling dizzy along with heavier bleeding can have several possible causes, and together they''re more than typical cycle discomfort.',
    '{}'
  ),
  (
    'unusual_bleeding_pattern',
    'Unusual bleeding pattern',
    'Fires when bleeding is logged during a phase window where it isn''t typically expected (e.g. well before the estimated period).',
    'routine',
    'Bleeding outside of when you''d expect your period can have several possible causes.',
    '{}'
  ),
  (
    'prolonged_bleeding',
    'Prolonged bleeding',
    'Fires when bleeding has been logged for more consecutive days than the configured threshold.',
    'routine',
    'Bleeding that continues longer than what''s typical for you can have several possible causes.',
    '{"thresholdDays": 8}'
  );
