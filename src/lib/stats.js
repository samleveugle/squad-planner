function createEmptyPlayerStats() {
  return { goals: 0, assists: 0 };
}

export function parseStatValue(value) {
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

export function getPlayerMatchStats(matchStats, eventId, playerId) {
  const stats = matchStats[eventId]?.[playerId];
  return stats ? { ...stats } : createEmptyPlayerStats();
}

export function getSeasonTotals(matchStats, playerId) {
  let goals = 0;
  let assists = 0;

  for (const eventStats of Object.values(matchStats)) {
    const stats = eventStats[playerId];
    if (stats) {
      goals += stats.goals ?? 0;
      assists += stats.assists ?? 0;
    }
  }

  return { goals, assists };
}

export function buildStatsPayload(playerStatsMap) {
  const payload = {};

  for (const [playerId, stats] of Object.entries(playerStatsMap)) {
    const goals = parseStatValue(stats.goals);
    const assists = parseStatValue(stats.assists);

    if (goals > 0 || assists > 0) {
      payload[playerId] = { goals, assists };
    }
  }

  return payload;
}
