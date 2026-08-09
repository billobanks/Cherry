-- Cherry — cycle-aware nutrition: dietary preference and stored avoidances.

alter table public.profiles
  add column dietary_preference text not null default 'none'
    check (dietary_preference in ('none', 'vegetarian', 'vegan', 'pescatarian')),
  add column food_allergies text[] not null default '{}',
  add column foods_to_avoid text[] not null default '{}';

comment on column public.profiles.food_allergies is
  'Free-text allergy entries the user has told us about — never medical advice, just used to filter food suggestions.';
comment on column public.profiles.foods_to_avoid is
  'Free-text dislikes/avoidances, filtered the same way as allergies but kept separate so the UI can label them distinctly.';
