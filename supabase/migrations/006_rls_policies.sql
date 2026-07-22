-- 006_rls_policies.sql
-- Idempotent: veilig opnieuw uitvoerbaar.
-- Geen DROP van policies, geen datawijzigingen.
-- Compatibel met createAdminClient() (service_role bypassed RLS).
-- Admin = players.is_admin waar players.auth_user_id = auth.uid()

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.current_player_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.players
  where auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select p.is_admin
      from public.players p
      where p.auth_user_id = auth.uid()
      limit 1
    ),
    false
  );
$$;

revoke all on function public.current_player_id() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.current_player_id() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- RLS aan (idempotent)
alter table public.players enable row level security;
alter table public.events enable row level security;
alter table public.availability enable row level security;
alter table public.lineups enable row level security;
alter table public.match_stats enable row level security;
alter table public.push_preferences enable row level security;
alter table public.availability_reminder_log enable row level security;

-- ---------------------------------------------------------------------------
-- Helper: policy alleen aanmaken als die nog niet bestaat
-- ---------------------------------------------------------------------------

create or replace function public.create_policy_if_not_exists(
  p_tablename text,
  p_policyname text,
  p_create_sql text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = p_tablename
      and policyname = p_policyname
  ) then
    execute p_create_sql;
  end if;
end;
$$;

revoke all on function public.create_policy_if_not_exists(text, text, text) from public;

-- ---------------------------------------------------------------------------
-- players
-- ---------------------------------------------------------------------------

select public.create_policy_if_not_exists(
  'players',
  'players_select_authenticated',
  $pol$
    create policy "players_select_authenticated"
      on public.players
      for select
      to authenticated
      using (auth.uid() is not null)
  $pol$
);

select public.create_policy_if_not_exists(
  'players',
  'players_insert_admin',
  $pol$
    create policy "players_insert_admin"
      on public.players
      for insert
      to authenticated
      with check (public.is_admin())
  $pol$
);

select public.create_policy_if_not_exists(
  'players',
  'players_update_admin',
  $pol$
    create policy "players_update_admin"
      on public.players
      for update
      to authenticated
      using (public.is_admin())
      with check (public.is_admin())
  $pol$
);

select public.create_policy_if_not_exists(
  'players',
  'players_delete_admin',
  $pol$
    create policy "players_delete_admin"
      on public.players
      for delete
      to authenticated
      using (public.is_admin())
  $pol$
);

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------

select public.create_policy_if_not_exists(
  'events',
  'events_select_authenticated',
  $pol$
    create policy "events_select_authenticated"
      on public.events
      for select
      to authenticated
      using (auth.uid() is not null)
  $pol$
);

select public.create_policy_if_not_exists(
  'events',
  'events_insert_admin',
  $pol$
    create policy "events_insert_admin"
      on public.events
      for insert
      to authenticated
      with check (public.is_admin())
  $pol$
);

select public.create_policy_if_not_exists(
  'events',
  'events_update_admin',
  $pol$
    create policy "events_update_admin"
      on public.events
      for update
      to authenticated
      using (public.is_admin())
      with check (public.is_admin())
  $pol$
);

select public.create_policy_if_not_exists(
  'events',
  'events_delete_admin',
  $pol$
    create policy "events_delete_admin"
      on public.events
      for delete
      to authenticated
      using (public.is_admin())
  $pol$
);

-- ---------------------------------------------------------------------------
-- availability
-- ---------------------------------------------------------------------------

select public.create_policy_if_not_exists(
  'availability',
  'availability_select_authenticated',
  $pol$
    create policy "availability_select_authenticated"
      on public.availability
      for select
      to authenticated
      using (auth.uid() is not null)
  $pol$
);

select public.create_policy_if_not_exists(
  'availability',
  'availability_insert_own',
  $pol$
    create policy "availability_insert_own"
      on public.availability
      for insert
      to authenticated
      with check (player_id = public.current_player_id())
  $pol$
);

select public.create_policy_if_not_exists(
  'availability',
  'availability_update_own',
  $pol$
    create policy "availability_update_own"
      on public.availability
      for update
      to authenticated
      using (player_id = public.current_player_id())
      with check (player_id = public.current_player_id())
  $pol$
);

select public.create_policy_if_not_exists(
  'availability',
  'availability_delete_own',
  $pol$
    create policy "availability_delete_own"
      on public.availability
      for delete
      to authenticated
      using (player_id = public.current_player_id())
  $pol$
);

-- ---------------------------------------------------------------------------
-- push_preferences
-- ---------------------------------------------------------------------------

select public.create_policy_if_not_exists(
  'push_preferences',
  'push_preferences_select_own',
  $pol$
    create policy "push_preferences_select_own"
      on public.push_preferences
      for select
      to authenticated
      using (player_id = public.current_player_id())
  $pol$
);

select public.create_policy_if_not_exists(
  'push_preferences',
  'push_preferences_insert_own',
  $pol$
    create policy "push_preferences_insert_own"
      on public.push_preferences
      for insert
      to authenticated
      with check (player_id = public.current_player_id())
  $pol$
);

select public.create_policy_if_not_exists(
  'push_preferences',
  'push_preferences_update_own',
  $pol$
    create policy "push_preferences_update_own"
      on public.push_preferences
      for update
      to authenticated
      using (player_id = public.current_player_id())
      with check (player_id = public.current_player_id())
  $pol$
);

select public.create_policy_if_not_exists(
  'push_preferences',
  'push_preferences_delete_own',
  $pol$
    create policy "push_preferences_delete_own"
      on public.push_preferences
      for delete
      to authenticated
      using (player_id = public.current_player_id())
  $pol$
);

-- ---------------------------------------------------------------------------
-- lineups
-- ---------------------------------------------------------------------------

select public.create_policy_if_not_exists(
  'lineups',
  'lineups_select_published_or_admin',
  $pol$
    create policy "lineups_select_published_or_admin"
      on public.lineups
      for select
      to authenticated
      using (published = true or public.is_admin())
  $pol$
);

select public.create_policy_if_not_exists(
  'lineups',
  'lineups_insert_admin',
  $pol$
    create policy "lineups_insert_admin"
      on public.lineups
      for insert
      to authenticated
      with check (public.is_admin())
  $pol$
);

select public.create_policy_if_not_exists(
  'lineups',
  'lineups_update_admin',
  $pol$
    create policy "lineups_update_admin"
      on public.lineups
      for update
      to authenticated
      using (public.is_admin())
      with check (public.is_admin())
  $pol$
);

select public.create_policy_if_not_exists(
  'lineups',
  'lineups_delete_admin',
  $pol$
    create policy "lineups_delete_admin"
      on public.lineups
      for delete
      to authenticated
      using (public.is_admin())
  $pol$
);

-- ---------------------------------------------------------------------------
-- match_stats
-- ---------------------------------------------------------------------------

select public.create_policy_if_not_exists(
  'match_stats',
  'match_stats_select_authenticated',
  $pol$
    create policy "match_stats_select_authenticated"
      on public.match_stats
      for select
      to authenticated
      using (auth.uid() is not null)
  $pol$
);

select public.create_policy_if_not_exists(
  'match_stats',
  'match_stats_insert_admin',
  $pol$
    create policy "match_stats_insert_admin"
      on public.match_stats
      for insert
      to authenticated
      with check (public.is_admin())
  $pol$
);

select public.create_policy_if_not_exists(
  'match_stats',
  'match_stats_update_admin',
  $pol$
    create policy "match_stats_update_admin"
      on public.match_stats
      for update
      to authenticated
      using (public.is_admin())
      with check (public.is_admin())
  $pol$
);

select public.create_policy_if_not_exists(
  'match_stats',
  'match_stats_delete_admin',
  $pol$
    create policy "match_stats_delete_admin"
      on public.match_stats
      for delete
      to authenticated
      using (public.is_admin())
  $pol$
);

-- ---------------------------------------------------------------------------
-- availability_reminder_log
-- ---------------------------------------------------------------------------

select public.create_policy_if_not_exists(
  'availability_reminder_log',
  'availability_reminder_log_select_admin',
  $pol$
    create policy "availability_reminder_log_select_admin"
      on public.availability_reminder_log
      for select
      to authenticated
      using (public.is_admin())
  $pol$
);

-- Tijdelijke helper opruimen na policy-aanmaak
drop function if exists public.create_policy_if_not_exists(text, text, text);
