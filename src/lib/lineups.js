import { DEFAULT_FORMATION, createEmptyPositions } from "@/lib/formations";
import { getEventResponseSummary as getEventResponseSummaryForPlayers, getPlayerById } from "@/lib/players";

export const MAX_BENCH_PLAYERS = 5;
export const MAX_STAFF = 3;

export function createEmptyLineup(formation = DEFAULT_FORMATION) {
  return {
    formation,
    positions: createEmptyPositions(formation),
    bench: [],
    staff: [],
    published: false,
    publishedAt: null,
  };
}

export function normalizeLineup(lineup, formation = DEFAULT_FORMATION) {
  if (!lineup) {
    return createEmptyLineup(formation);
  }

  return {
    ...createEmptyLineup(lineup.formation ?? formation),
    ...lineup,
    bench: lineup.bench ?? [],
    staff: lineup.staff ?? [],
  };
}

export function getLineupForEvent(lineups, eventId) {
  return lineups[eventId] ?? null;
}

export function getPublishedLineup(lineups, eventId) {
  const lineup = getLineupForEvent(lineups, eventId);
  if (!lineup?.published) {
    return null;
  }
  return normalizeLineup(lineup);
}

export function getEligiblePlayers(eventId, responses, players) {
  const { present, doubt } = getEventResponseSummaryForPlayers(
    players,
    eventId,
    responses
  );
  return [...present, ...doubt];
}

export function getAllAssignedPlayerIds({ positions = {}, bench = [], staff = [] }) {
  return new Set([
    ...Object.values(positions).filter(Boolean),
    ...bench.filter(Boolean),
    ...staff.filter(Boolean),
  ]);
}

export function getMatchSquadPlayerIds(lineup) {
  if (!lineup) {
    return [];
  }

  const normalized = normalizeLineup(lineup);
  return [
    ...Object.values(normalized.positions).filter(Boolean),
    ...(normalized.bench ?? []).filter(Boolean),
  ];
}

export function getMatchSquadPlayers(lineup, players) {
  return getMatchSquadPlayerIds(lineup)
    .map((playerId) => getPlayerById(players, playerId))
    .filter(Boolean);
}

export function hasMatchSquad(lineup) {
  return getMatchSquadPlayerIds(lineup).length > 0;
}

export function isPlayerInLineup(lineup, playerId) {
  if (!lineup || !playerId) {
    return false;
  }

  const assigned = getAllAssignedPlayerIds(lineup);
  return assigned.has(playerId);
}

export function getPlayerLineupRole(lineup, playerId) {
  if (!lineup || !playerId) {
    return null;
  }

  if (Object.values(lineup.positions ?? {}).includes(playerId)) {
    return "field";
  }

  if ((lineup.bench ?? []).includes(playerId)) {
    return "bench";
  }

  if ((lineup.staff ?? []).includes(playerId)) {
    return "staff";
  }

  return null;
}

export function getLineupRoleLabel(role) {
  switch (role) {
    case "field":
      return "Basisopstelling";
    case "bench":
      return "Bank";
    case "staff":
      return "Staf";
    default:
      return null;
  }
}

export function getUnseenPublishedLineups(events, lineups, seenLineups) {
  return events.filter((event) => {
    if (event.type !== "match") {
      return false;
    }
    const lineup = getPublishedLineup(lineups, event.id);
    return lineup && !seenLineups[event.id];
  });
}

export function formatPublishedAt(isoString) {
  if (!isoString) {
    return null;
  }

  return new Date(isoString).toLocaleString("nl-BE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getPlayerName(players, playerId) {
  return getPlayerById(players, playerId)?.name ?? "Onbekend";
}

export function getBenchPlayers(players, bench = []) {
  return bench
    .filter(Boolean)
    .map((playerId) => getPlayerById(players, playerId))
    .filter(Boolean);
}

export function getStaffPlayers(players, staff = []) {
  return staff
    .filter(Boolean)
    .map((playerId) => getPlayerById(players, playerId))
    .filter(Boolean);
}
