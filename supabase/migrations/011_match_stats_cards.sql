alter table match_stats
  add column if not exists yellow_cards integer not null default 0 check (yellow_cards >= 0),
  add column if not exists red_cards integer not null default 0 check (red_cards >= 0);
