-- Drafts staged by the atlas MCP tool (gametracker_stage_game) after an AI
-- client (e.g. Claude, via the atlas gateway) classifies pasted game text.
-- Inserted with the service role, bypassing RLS, since the caller has no
-- user session — the API route resolves the single owner's user_id itself.
-- The web app shows these to the owner as pre-filled drafts in the existing
-- Add Game modal for review before they become real gametracker.games rows.
create table gametracker.pending_games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  store gametracker.store,
  store_id text,
  install_status gametracker.install_status,
  install_path text,
  play_status gametracker.play_status,
  playtime_minutes integer check (playtime_minutes >= 0),
  last_played_at timestamptz,
  deck_compat gametracker.deck_compat,
  rating smallint check (rating between 1 and 10),
  notes text,
  price_amount numeric,
  price_currency text,
  source_text text,
  created_at timestamptz not null default now()
);

create index pending_games_user_id_idx on gametracker.pending_games (user_id);

alter table gametracker.pending_games enable row level security;

-- Same ownership pattern as gametracker.games — the owner can see and
-- remove their own drafts (accept turns into an insert into games done by
-- the app's own server action, then a delete here).
create policy "users manage their own pending games"
  on gametracker.pending_games
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
