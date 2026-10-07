function toScoreValue(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

export function rowToEvent(row) {
  if (!row) {
    return null;
  }

  const isMatch = row.type === "match";

  return {
    id: row.id,
    type: row.type,
    date: row.date,
    time: row.time ?? null,
    location: row.location,
    isHome: isMatch ? (row.is_home ?? false) : undefined,
    opponent: row.opponent ?? null,
    title: row.title ?? null,
    scoreFor: isMatch ? toScoreValue(row.score_for) : undefined,
    scoreAgainst: isMatch ? toScoreValue(row.score_against) : undefined,
  };
}

export function eventToRow(event) {
  const row = {
    id: event.id,
    type: event.type,
    date: event.date,
    time: event.time ?? null,
    location: event.location,
    is_home: event.type === "match" ? Boolean(event.isHome) : null,
    opponent: event.opponent?.trim() || null,
    title:
      event.type === "evenement" ? event.title?.trim() || null : null,
  };

  if (event.type === "match" && ("scoreFor" in event || "scoreAgainst" in event)) {
    row.score_for = toScoreValue(event.scoreFor);
    row.score_against = toScoreValue(event.scoreAgainst);
  }

  return row;
}
