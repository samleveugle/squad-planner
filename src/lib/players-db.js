export const PLAYER_EMAILS = {
  sam: "leveuglesam98@gmail.com",
};

export function getPlayerEmail(playerId) {
  return PLAYER_EMAILS[playerId] ?? null;
}

export function rowToPlayer(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email ?? null,
    isAdmin: row.is_admin ?? false,
    isSquadPlayer: row.is_squad_player ?? true,
  };
}
