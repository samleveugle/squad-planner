-- Push notification preferences + reminder log (Sessie push)

create table if not exists push_preferences (
  player_id text primary key references players (id) on delete cascade,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists availability_reminder_log (
  week_start date primary key,
  sent_at timestamptz not null default now(),
  recipient_count integer not null default 0
);
