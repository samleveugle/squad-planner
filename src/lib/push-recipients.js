import { rowToPlayer } from "@/lib/players-db";

export const LINEUP_PUBLISHED_MESSAGE =
  "Er is een nieuwe opstelling beschikbaar.";

export function getPushEnabledSquadPlayerIds({ players, pushEnabledPlayerIds }) {
  const pushEnabled = new Set(pushEnabledPlayerIds);

  return players
    .filter((player) => {
      if (!player.isSquadPlayer || !player.authUserId) {
        return false;
      }

      return pushEnabled.has(player.id);
    })
    .map((player) => player.id);
}

export async function fetchPushEnabledSquadPlayerIds(supabase) {
  const [
    { data: playerRows, error: playersError },
    { data: pushRows, error: pushError },
  ] = await Promise.all([
    supabase
      .from("players")
      .select("id, name, is_admin, is_squad_player, auth_user_id")
      .not("auth_user_id", "is", null),
    supabase.from("push_preferences").select("player_id, enabled").eq("enabled", true),
  ]);

  if (playersError) {
    throw playersError;
  }

  if (pushError) {
    throw pushError;
  }

  const players = (playerRows ?? []).map((row) => ({
    ...rowToPlayer(row),
    authUserId: row.auth_user_id,
  }));
  const pushEnabledPlayerIds = (pushRows ?? []).map((row) => row.player_id);

  return getPushEnabledSquadPlayerIds({ players, pushEnabledPlayerIds });
}
