-- Frisse: staf-admin (alle admin-tabs), geen ploegspeler. Fozzie blijft view-only.

update public.players
set
  is_admin = true,
  is_squad_player = false
where id = 'frisse';
