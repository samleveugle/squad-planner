-- Squad Planner — initial schema (Sessie 6a)
-- Run via: npm run db:migrate

create table if not exists players (
  id text primary key,
  name text not null,
  is_admin boolean not null default false,
  is_squad_player boolean not null default true,
  email text unique,
  auth_user_id uuid unique,
  created_at timestamptz not null default now()
);

create table if not exists events (
  id text primary key,
  type text not null check (type in ('training', 'match')),
  date date not null,
  time text,
  location text not null,
  is_home boolean,
  opponent text,
  created_at timestamptz not null default now()
);

create table if not exists availability (
  id bigint generated always as identity primary key,
  player_id text not null references players (id) on delete cascade,
  event_id text not null references events (id) on delete cascade,
  status text not null check (status in ('present', 'doubt', 'absent')),
  updated_at timestamptz not null default now(),
  unique (player_id, event_id)
);

create table if not exists lineups (
  event_id text primary key references events (id) on delete cascade,
  formation text not null default '4-3-3',
  positions jsonb not null default '{}'::jsonb,
  bench jsonb not null default '[]'::jsonb,
  staff jsonb not null default '[]'::jsonb,
  published boolean not null default false,
  published_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists match_stats (
  id bigint generated always as identity primary key,
  event_id text not null references events (id) on delete cascade,
  player_id text not null references players (id) on delete cascade,
  goals integer not null default 0 check (goals >= 0),
  assists integer not null default 0 check (assists >= 0),
  updated_at timestamptz not null default now(),
  unique (event_id, player_id)
);

create index if not exists events_date_idx on events (date);
create index if not exists availability_event_id_idx on availability (event_id);
create index if not exists availability_player_id_idx on availability (player_id);
create index if not exists match_stats_event_id_idx on match_stats (event_id);
