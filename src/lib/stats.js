import { getPlayerById, SQUAD_PLAYERS } from "@/lib/mock-data";

export function createEmptyPlayerStats() {
  return { goals: 0, assists: 0 };
}

export function parseStatValue(value) {
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

export function getMatchStatsForEvent(matchStats, eventId) {
  return matchStats[eventId] ?? {};
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

export function getMatchEvents(events = EVENTS) {
  return events.filter((event) => event.type === "match");
}

export function getPlayerMatchHistory(matchStats, playerId, events = EVENTS) {
  return getMatchEvents(events)
    .map((event) => ({
      event,
      stats: getPlayerMatchStats(matchStats, event.id, playerId),
    }))
    .filter(({ stats }) => stats.goals > 0 || stats.assists > 0)
    .sort((a, b) => b.event.date.localeCompare(a.event.date));
}

export function getSeasonRanking(matchStats, sortBy = "goals") {
  const ranking = SQUAD_PLAYERS.map((player) => ({
    player,
    ...getSeasonTotals(matchStats, player.id),
  }));

  ranking.sort((a, b) => {
    if (sortBy === "assists") {
      return b.assists - a.assists || b.goals - a.goals || a.player.name.localeCompare(b.player.name);
    }

    return b.goals - a.goals || b.assists - a.assists || a.player.name.localeCompare(b.player.name);
  });

  return ranking;
}

export function hasRecordedStats(matchStats, eventId) {
  const eventStats = matchStats[eventId];
  if (!eventStats) {
    return false;
  }

  return Object.values(eventStats).some(
    (stats) => (stats.goals ?? 0) > 0 || (stats.assists ?? 0) > 0
  );
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

export function createDraftFromSaved(matchStats, eventId, playerIds) {
  const draft = {};
  const ids = playerIds ?? SQUAD_PLAYERS.map((player) => player.id);

  for (const playerId of ids) {
    draft[playerId] = getPlayerMatchStats(matchStats, eventId, playerId);
  }

  return draft;
}

export function getPlayerName(playerId) {
  return getPlayerById(playerId)?.name ?? "Onbekend";
}
