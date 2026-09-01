-- Cherry — seed data for the normalized schema refactor
-- content_categories / content_articles only — every other table in the
-- refactor is either backfilled from real data (see the migration itself)
-- or has no meaningful seed (predictions/insights/pattern snapshots are
-- computed per-user, not seeded).

insert into public.content_categories (key, label, sort_order) values
  ('cycle_basics', 'Cycle basics', 10),
  ('nutrition', 'Nutrition', 20),
  ('movement', 'Movement', 30),
  ('emotional_wellbeing', 'Emotional wellbeing', 40)
on conflict (key) do nothing;

insert into public.content_articles (category_id, slug, title, body, status, source, medical_reviewer, date_reviewed, published_at)
select
  c.id,
  'understanding-your-cycle-phases',
  'Understanding your cycle phases',
  'Your menstrual cycle has four commonly described phases — menstrual, follicular, ovulation window, and luteal — each shaped by shifting hormone levels. This is general education, not a diagnosis, and every cycle varies in how strongly (or whether) any of these show up.',
  'draft',
  null,
  null,
  null,
  null
from public.content_categories c
where c.key = 'cycle_basics'
on conflict (slug) do nothing;

insert into public.content_articles (category_id, slug, title, body, status, source, medical_reviewer, date_reviewed, published_at)
select
  c.id,
  'eating-for-your-cycle',
  'Eating for your cycle',
  'Nutrient needs can shift a little across the cycle — iron-rich foods are commonly mentioned around your period, and steady, balanced meals are a reasonable default the rest of the time. None of this is required or prescriptive; it''s general education to draw on if it''s useful to you.',
  'draft',
  null,
  null,
  null,
  null
from public.content_categories c
where c.key = 'nutrition'
on conflict (slug) do nothing;

comment on table public.content_articles is
  'General editorial articles. Only status = published rows are selectable by non-admins — enforced in the RLS policy itself. Seeded rows above are intentionally left in DRAFT: this refactor did not have real medical review capacity, and unreviewed content must never appear in production. Move a row to PUBLISHED only after an admin reviews it from an admin content-management UI.';
