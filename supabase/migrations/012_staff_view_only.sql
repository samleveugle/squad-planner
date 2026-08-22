-- Staf zonder admin (Fozzie, Frisse): geen ploegspeler, geen admin-rechten
-- Tabs Kalender + Team worden in de app afgehandeld via STAFF_VIEW_ONLY_PLAYER_IDS.

update public.players
set
  is_admin = false,
  is_squad_player = false
where id in ('fozzie', 'frisse');
