-- Admin-only staf (Pol, Gijs): geen ploegspeler, wel admin

update public.players
set
  is_admin = true,
  is_squad_player = false
where id in ('pol', 'gijs');
