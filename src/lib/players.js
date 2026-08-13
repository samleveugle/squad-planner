export function toPlayerId(name) {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

export function getPlayerById(players, playerId) {
  return players.find((player) => player.id === playerId);
}

export function getSquadPlayers(players) {
  return players.filter((player) => player.isSquadPlayer);
}

export function getResponseKey(playerId, eventId) {
  return `${playerId}-${eventId}`;
}

export function getPlayersByStatus(players, eventId, responses, status) {
  return players.filter(
    (player) => responses[getResponseKey(player.id, eventId)] === status
  );
}

export function isStaffMember(player) {
  return Boolean(player.isAdmin) && player.isSquadPlayer === false;
}

export function splitPlayersByRole(players) {
  const squad = [];
  const staff = [];

  for (const player of players) {
    if (isStaffMember(player)) {
      staff.push(player);
    } else {
      squad.push(player);
    }
  }

  return { squad, staff };
}

export function getEventResponseSummary(players, eventId, responses) {
  const present = getPlayersByStatus(players, eventId, responses, "present");
  const doubt = getPlayersByStatus(players, eventId, responses, "doubt");
  const absent = getPlayersByStatus(players, eventId, responses, "absent");
  const unanswered = players.filter(
    (player) => !responses[getResponseKey(player.id, eventId)]
  );

  return { present, doubt, absent, unanswered };
}

/** Compacte breakdown, bv. "17 spelers" of "16 spelers / 1 staf". */
export function formatRoleBreakdown(players) {
  const { squad, staff } = splitPlayersByRole(players);

  if (staff.length === 0) {
    return `${squad.length} spelers`;
  }

  return `${squad.length} spelers / ${staff.length} staf`;
}

export function getPlayerName(players, playerId) {
  return getPlayerById(players, playerId)?.name ?? "Onbekend";
}

export function sortPlayersByName(players) {
  return [...players].sort((a, b) => a.name.localeCompare(b.name, "nl-BE"));
}
