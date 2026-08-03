-- 007_event_attendance.sql
-- Effectieve aanwezigheid na training/match (+ speelminuten bij wedstrijden).
-- Los van availability (RSVP vooraf).

create table if not exists public.event_attendance (
  id bigint generated always as identity primary key,
  event_id text not null references public.events (id) on delete cascade,
  player_id text not null references public.players (id) on delete cascade,
  attended boolean not null default false,
  minutes integer check (minutes is null or minutes >= 0),
  updated_at timestamptz not null default now(),
  unique (event_id, player_id)
);

create index if not exists event_attendance_event_id_idx
  on public.event_attendance (event_id);

create index if not exists event_attendance_player_id_idx
  on public.event_attendance (player_id);

alter table public.event_attendance enable row level security;

-- Policies (service_role bypassed RLS; JWT policies for direct API access)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'event_attendance'
      and policyname = 'event_attendance_select_authenticated'
  ) then
    create policy "event_attendance_select_authenticated"
      on public.event_attendance
      for select
      to authenticated
      using (auth.uid() is not null);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'event_attendance'
      and policyname = 'event_attendance_insert_admin'
  ) then
    create policy "event_attendance_insert_admin"
      on public.event_attendance
      for insert
      to authenticated
      with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'event_attendance'
      and policyname = 'event_attendance_update_admin'
  ) then
    create policy "event_attendance_update_admin"
      on public.event_attendance
      for update
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'event_attendance'
      and policyname = 'event_attendance_delete_admin'
  ) then
    create policy "event_attendance_delete_admin"
      on public.event_attendance
      for delete
      to authenticated
      using (public.is_admin());
  end if;
end $$;
