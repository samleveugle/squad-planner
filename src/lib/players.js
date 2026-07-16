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

export function getEventResponseSummary(players, eventId, responses) {
  const present = getPlayersByStatus(players, eventId, responses, "present");
  const doubt = getPlayersByStatus(players, eventId, responses, "doubt");
  const absent = getPlayersByStatus(players, eventId, responses, "absent");
  const unanswered = players.filter(
    (player) => !responses[getResponseKey(player.id, eventId)]
  );

  return { present, doubt, absent, unanswered };
}

export function getPlayerName(players, playerId) {
  return getPlayerById(players, playerId)?.name ?? "Onbekend";
}

export function sortPlayersByName(players) {
  return [...players].sort((a, b) => a.name.localeCompare(b.name, "nl-BE"));
}
