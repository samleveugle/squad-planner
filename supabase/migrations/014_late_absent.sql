-- Last-minute afwezig: aanwezig → afwezig vanaf 00:00 op de trainingsdag.

alter table public.availability
  add column if not exists late_absent boolean not null default false;
