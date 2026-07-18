export function rowToPushPreference(row) {
  if (!row) {
    return null;
  }

  return {
    playerId: row.player_id,
    enabled: row.enabled ?? false,
    updatedAt: row.updated_at ?? null,
  };
}
