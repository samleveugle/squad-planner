import { ADMIN_ONLY_PLAYER_IDS } from "@/lib/mock-data";

export const PLAYER_EMAILS = {
  sam: "leveuglesam98@gmail.com",
};

export function getPlayerEmail(playerId) {
  return PLAYER_EMAILS[playerId] ?? null;
}

function resolvePlayerRoles(row) {
  let isAdmin = Boolean(row.is_admin);
  let isSquadPlayer = row.is_squad_player !== false;

  if (ADMIN_ONLY_PLAYER_IDS.has(row.id)) {
    isAdmin = true;
    isSquadPlayer = false;
  }

  return { isAdmin, isSquadPlayer };
}

export function rowToPlayer(row) {
  if (!row) {
    return null;
  }

  const { isAdmin, isSquadPlayer } = resolvePlayerRoles(row);

  return {
    id: row.id,
    name: row.name,
    email: row.email ?? null,
    isAdmin,
    isSquadPlayer,
  };
}
