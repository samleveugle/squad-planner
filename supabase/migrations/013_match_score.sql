-- Wedstrijdscore (onze goals – hun goals). Null = nog niet ingevuld; 0-0 is geldig.

alter table public.events
  add column if not exists score_for integer check (score_for is null or score_for >= 0),
  add column if not exists score_against integer check (score_against is null or score_against >= 0);

alter table public.events
  drop constraint if exists events_score_both_or_neither;

alter table public.events
  add constraint events_score_both_or_neither
  check (
    (score_for is null and score_against is null)
    or (score_for is not null and score_against is not null)
  );
