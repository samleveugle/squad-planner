import { DEFAULT_FORMATION, createEmptyPositions } from "@/lib/formations";
import { getEventResponseSummary as getEventResponseSummaryForPlayers } from "@/lib/players";

export const MAX_BENCH_PLAYERS = 5;
export const MAX_EXTRA_BENCH_PLAYERS = 3;
export const MAX_BENCH_TOTAL = MAX_BENCH_PLAYERS + MAX_EXTRA_BENCH_PLAYERS;
export const MAX_STAFF = 3;
export const MAX_EXTRA_STAFF = 2;
export const MAX_STAFF_TOTAL = MAX_STAFF + MAX_EXTRA_STAFF;
export const MIN_SHIRT_NUMBER = 1;
export const MAX_SHIRT_NUMBER = 21;

export function getVisibleBenchSlotCount(bench = []) {
  return Math.min(MAX_BENCH_TOTAL, Math.max(MAX_BENCH_PLAYERS, bench.length));
}

export function getVisibleStaffSlotCount(staff = []) {
  return Math.min(MAX_STAFF_TOTAL, Math.max(MAX_STAFF, staff.length));
}

export function getBenchDisplaySlots(bench = []) {
  const count = getVisibleBenchSlotCount(bench);
  return Array.from({ length: count }, (_, index) => bench[index] ?? null);
}

export function getStaffDisplaySlots(staff = []) {
  const count = getVisibleStaffSlotCount(staff);
  return Array.from({ length: count }, (_, index) => staff[index] ?? null);
}

export function createEmptyLineup(formation = DEFAULT_FORMATION) {
  return {
    formation,
    positions: createEmptyPositions(formation),
    bench: [],
    staff: [],
    numbers: {},
    captainId: null,
    published: false,
    publishedAt: null,
  };
}

export function normalizeLineup(lineup, formation = DEFAULT_FORMATION) {
  if (!lineup) {
    return createEmptyLineup(formation);
  }

  const normalized = {
    ...createEmptyLineup(lineup.formation ?? formation),
    ...lineup,
    bench: lineup.bench ?? [],
    staff: lineup.staff ?? [],
    numbers: lineup.numbers ?? {},
    captainId: lineup.captainId ?? null,
  };

  const onField = new Set(Object.values(normalized.positions).filter(Boolean));
  if (normalized.captainId && !onField.has(normalized.captainId)) {
    normalized.captainId = null;
  }

  return normalized;
}

export function formatPlayerWithNumber(name, number) {
  if (number == null) {
    return name;
  }

  return `${number} · ${name}`;
}

export function formatFieldPlayerLabel(name, number, isCaptain = false) {
  const parts = [];

  if (number != null) {
    parts.push(String(number));
  }

  if (isCaptain) {
    parts.push("C");
  }

  parts.push(name);
  return parts.join(" · ");
}

export function getFieldPlayerIds(positions = {}) {
  return Object.values(positions).filter(Boolean);
}

export function pruneLineupNumbers(numbers, assignedPlayerIds) {
  const allowed = new Set(assignedPlayerIds);
  const next = {};

  for (const [playerId, number] of Object.entries(numbers ?? {})) {
    if (allowed.has(playerId)) {
      next[playerId] = number;
    }
  }

  return next;
}

export function validateLineupNumbers(numbers, assignedPlayerIds) {
  const allowed = new Set(assignedPlayerIds);
  const seen = new Set();
  const errors = [];

  for (const [playerId, rawNumber] of Object.entries(numbers ?? {})) {
    if (!allowed.has(playerId)) {
      continue;
    }

    const number = Number(rawNumber);

    if (!Number.isInteger(number) || number < MIN_SHIRT_NUMBER || number > MAX_SHIRT_NUMBER) {
      errors.push(`Rugnummer moet tussen ${MIN_SHIRT_NUMBER} en ${MAX_SHIRT_NUMBER} liggen.`);
      continue;
    }

    if (seen.has(number)) {
      errors.push(`Rugnummer ${number} is dubbel toegewezen.`);
    } else {
      seen.add(number);
    }
  }

  return {
    valid: errors.length === 0,
    error: errors[0] ?? null,
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
    return lineup && seenLineups[event.id] !== lineup.publishedAt;
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
