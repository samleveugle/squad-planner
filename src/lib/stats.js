function createEmptyPlayerStats() {
  return { goals: 0, assists: 0, yellowCards: 0, redCards: 0 };
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
  return stats ? { ...createEmptyPlayerStats(), ...stats } : createEmptyPlayerStats();
}

export function getSeasonTotals(matchStats, playerId, seasonEventIds = null) {
  let goals = 0;
  let assists = 0;
  let yellowCards = 0;
  let redCards = 0;

  for (const [eventId, eventStats] of Object.entries(matchStats)) {
    if (seasonEventIds && !seasonEventIds.has(eventId)) {
      continue;
    }

    const stats = eventStats[playerId];
    if (stats) {
      goals += stats.goals ?? 0;
      assists += stats.assists ?? 0;
      yellowCards += stats.yellowCards ?? 0;
      redCards += stats.redCards ?? 0;
    }
  }

  return { goals, assists, yellowCards, redCards };
}

export function buildStatsPayload(playerStatsMap) {
  const payload = {};

  for (const [playerId, stats] of Object.entries(playerStatsMap)) {
    const goals = parseStatValue(stats.goals);
    const assists = parseStatValue(stats.assists);
    const yellowCards = parseStatValue(stats.yellowCards);
    const redCards = parseStatValue(stats.redCards);

    if (goals > 0 || assists > 0 || yellowCards > 0 || redCards > 0) {
      payload[playerId] = { goals, assists, yellowCards, redCards };
    }
  }

  return payload;
}
