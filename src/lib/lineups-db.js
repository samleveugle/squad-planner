import { normalizeLineup } from "@/lib/lineups";

export function rowToLineup(row) {
  if (!row) {
    return null;
  }

  return normalizeLineup({
    formation: row.formation,
    positions: row.positions ?? {},
    bench: row.bench ?? [],
    staff: row.staff ?? [],
    numbers: row.numbers ?? {},
    published: row.published ?? false,
    publishedAt: row.published_at ?? null,
  });
}

export function lineupToRow(eventId, lineup) {
  const normalized = normalizeLineup(lineup);

  return {
    event_id: eventId,
    formation: normalized.formation,
    positions: normalized.positions,
    bench: normalized.bench,
    staff: normalized.staff,
    numbers: normalized.numbers ?? {},
    published: normalized.published ?? false,
    published_at: normalized.publishedAt ?? null,
    updated_at: new Date().toISOString(),
  };
}

export function rowsToLineupsMap(rows) {
  return rows.reduce((lineups, row) => {
    lineups[row.event_id] = rowToLineup(row);
    return lineups;
  }, {});
}
