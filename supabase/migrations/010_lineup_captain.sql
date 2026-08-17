alter table lineups
add column if not exists captain_id text references players (id) on delete set null;
