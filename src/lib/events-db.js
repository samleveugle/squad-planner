export function rowToEvent(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    type: row.type,
    date: row.date,
    time: row.time ?? null,
    location: row.location,
    isHome: row.type === "match" ? (row.is_home ?? false) : undefined,
    opponent: row.opponent ?? null,
  };
}

export function eventToRow(event) {
  return {
    id: event.id,
    type: event.type,
    date: event.date,
    time: event.time ?? null,
    location: event.location,
    is_home: event.type === "match" ? Boolean(event.isHome) : null,
    opponent: event.opponent?.trim() || null,
  };
}
