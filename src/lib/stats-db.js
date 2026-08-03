export function rowsToMatchStatsMap(rows) {
  return rows.reduce((matchStats, row) => {
    if (!matchStats[row.event_id]) {
      matchStats[row.event_id] = {};
    }

    matchStats[row.event_id][row.player_id] = {
      goals: row.goals ?? 0,
      assists: row.assists ?? 0,
    };

    return matchStats;
  }, {});
}

export function statsPayloadToRows(eventId, statsPayload) {
  return Object.entries(statsPayload ?? {}).map(([playerId, stats]) => ({
    event_id: eventId,
    player_id: playerId,
    goals: stats?.goals ?? 0,
    assists: stats?.assists ?? 0,
    updated_at: new Date().toISOString(),
  }));
}
