alter table lineups
add column if not exists numbers jsonb not null default '{}'::jsonb;
