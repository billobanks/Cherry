-- Cherry — AI wellness assistant
-- One continuous chat thread per user (no multi-conversation management —
-- keeps this a single ongoing "chat with Cherry", matching how the feature
-- is presented in the UI). Messages are plain text; which AI provider
-- generated an 'assistant' row is an application concern, not a schema one.

create table public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) <= 4000),
  created_at timestamptz not null default now()
);

comment on table public.assistant_messages is
  'A single ongoing chat thread per user with the AI wellness assistant. Provides education only — never a diagnosis. See src/lib/assistant/ for the provider abstraction, context assembly, and safety-prompt composition.';

alter table public.assistant_messages enable row level security;

create policy "assistant_messages_all_own" on public.assistant_messages
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create index assistant_messages_user_created_idx
  on public.assistant_messages (user_id, created_at);
