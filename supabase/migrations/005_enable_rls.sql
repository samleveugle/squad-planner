-- Enable RLS on all public app tables (Optie A).
-- App data access goes through SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
-- No policies for anon/authenticated = default deny via PostgREST for those roles.
-- Auth (login/signup) remains on the anon key and is unaffected.

alter table public.players enable row level security;
alter table public.events enable row level security;
alter table public.availability enable row level security;
alter table public.lineups enable row level security;
alter table public.match_stats enable row level security;
alter table public.push_preferences enable row level security;
alter table public.availability_reminder_log enable row level security;
