-- Cherry — Daily Body Insights feedback
-- Stores "Does this sound like you?" responses per section per day, so future
-- insights can be personalized against what a user has actually said matched.

create table public.daily_insight_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  insight_date date not null,
  cycle_phase text not null
    check (cycle_phase in ('menstrual', 'follicular', 'ovulation_window', 'luteal')),
  section_key text not null
    check (section_key in (
      'body_overview', 'hormonal_changes', 'energy', 'mood', 'skin', 'digestion',
      'appetite_and_cravings', 'sleep', 'exercise', 'nutrition', 'self_care',
      'symptoms_to_monitor', 'professional_guidance'
    )),
  response text not null check (response in ('yes', 'no', 'a_little')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, insight_date, section_key)
);

comment on table public.daily_insight_feedback is
  'One row per (user, day, section): their "Does this sound like you?" answer. cycle_phase is captured alongside the response so later phases of the same type can be compared without recomputing history.';

alter table public.daily_insight_feedback enable row level security;

create policy "daily_insight_feedback_all_own" on public.daily_insight_feedback
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create trigger daily_insight_feedback_set_updated_at
  before update on public.daily_insight_feedback
  for each row execute function public.set_updated_at();

create index daily_insight_feedback_user_phase_section_idx
  on public.daily_insight_feedback (user_id, cycle_phase, section_key);
