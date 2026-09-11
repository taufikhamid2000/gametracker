-- GameTracker: dedicated schema on the shared master_db Supabase project
-- (ref hmkjszolqnpcsoatrgcu), following the per-app-schema convention
-- (edubridge, veyoyee, ...) rather than a public.gametracker_ prefix.

create schema if not exists gametracker;

create type gametracker.store as enum (
  'steam', 'epic', 'gog', 'ubisoft', 'ea', 'xbox', 'other'
);

create type gametracker.install_status as enum (
  'not_installed', 'installed'
);

create type gametracker.play_status as enum (
  'backlog', 'playing', 'finished', 'dropped'
);

-- Mirrors Steam's own Deck compatibility categories.
create type gametracker.deck_compat as enum (
  'unknown', 'verified', 'playable', 'unsupported'
);

create table gametracker.games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  store gametracker.store not null default 'steam',
  store_id text,
  install_status gametracker.install_status not null default 'not_installed',
  install_path text,
  play_status gametracker.play_status not null default 'backlog',
  playtime_minutes integer not null default 0 check (playtime_minutes >= 0),
  last_played_at timestamptz,
  deck_compat gametracker.deck_compat not null default 'unknown',
  rating smallint check (rating between 1 and 10),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Same title can legitimately appear twice (different store), but the
-- same store listing shouldn't be added twice for one user.
create unique index games_user_store_store_id_key
  on gametracker.games (user_id, store, store_id)
  where store_id is not null;

create index games_user_id_idx on gametracker.games (user_id);
create index games_user_play_status_idx on gametracker.games (user_id, play_status);

-- Reuses the shared trigger function already defined in public (same one
-- every other app's `updated_at` column uses) rather than duplicating it.
create trigger set_games_updated_at
  before update on gametracker.games
  for each row execute function public.set_updated_at();

alter table gametracker.games enable row level security;

create policy "users manage their own games"
  on gametracker.games
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Data API exposure (mirrors the pattern used for every other per-app
-- schema on this project). No anon access — this is private library data
-- behind auth, same model as duitduit.
grant usage on schema gametracker to authenticated, service_role;
grant select, insert, update, delete on all tables in schema gametracker to authenticated;
grant all on all tables in schema gametracker to service_role;
grant all on all sequences in schema gametracker to authenticated, service_role;
alter default privileges in schema gametracker grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema gametracker grant all on tables to service_role;
