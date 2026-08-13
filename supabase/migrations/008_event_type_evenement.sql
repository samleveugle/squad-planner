-- Evenement type + titel voor niet-training/wedstrijd events

alter table public.events drop constraint if exists events_type_check;

alter table public.events
  add constraint events_type_check
  check (type in ('training', 'match', 'evenement'));

alter table public.events
  add column if not exists title text;
