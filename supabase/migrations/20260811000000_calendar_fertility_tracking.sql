-- Cherry — calendar support: an opt-in intercourse/fertility tracking layer.
-- Off by default; the calendar only ever renders this layer when the user
-- has explicitly turned it on.

alter table public.profiles
  add column fertility_tracking_enabled boolean not null default false;

alter table public.daily_checkins
  add column intercourse boolean;
