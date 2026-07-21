-- Wis test-aanwezigheden en gerelateerde testdata vóór live gebruik.
-- Behoudt: players, events, auth users.

truncate table availability restart identity cascade;
truncate table lineups cascade;
truncate table match_stats restart identity cascade;
truncate table availability_reminder_log cascade;
