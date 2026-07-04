import { DEFAULT_FORMATION, createEmptyPositions } from "@/lib/formations";
import { getEventResponseSummary, getPlayerById } from "@/lib/mock-data";

export function createEmptyLineup(formation = DEFAULT_FORMATION) {
  return {
    formation,
    positions: createEmptyPositions(formation),
    published: false,
    publishedAt: null,
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
  return lineup;
}

export function getEligiblePlayers(eventId, responses) {
  const { present, doubt } = getEventResponseSummary(eventId, responses);
  return [...present, ...doubt];
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

export function getPlayerName(playerId) {
  return getPlayerById(playerId)?.name ?? "Onbekend";
}
