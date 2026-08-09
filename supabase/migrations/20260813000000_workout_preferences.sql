-- Cherry — cycle-aware movement: stored workout type preferences.

alter table public.profiles
  add column workout_preferences text[] not null default '{}'
    check (workout_preferences <@ array[
      'walking', 'yoga', 'stretching', 'strength_training', 'pilates',
      'cycling', 'running', 'hiit', 'recovery_rest'
    ]::text[]);

comment on column public.profiles.workout_preferences is
  'Movement types the user says they enjoy. Used to break ties among equally-appropriate options, never to override a safety-appropriate intensity.';
