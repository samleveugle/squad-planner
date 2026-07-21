import { eventToRow, rowToEvent } from "@/lib/events-db";
import { fetchRbfaMatchEvents, getRbfaTeamId } from "@/lib/rbfa";
import { createAdminClient } from "@/lib/supabase/admin";

function isSameMatch(existing, incoming) {
  return (
    existing.date === incoming.date &&
    (existing.time ?? null) === (incoming.time ?? null) &&
    existing.location === incoming.location &&
    Boolean(existing.is_home) === Boolean(incoming.isHome) &&
    (existing.opponent ?? null) === (incoming.opponent ?? null)
  );
}

/**
 * Idempotent upsert of RBFA matches into `events` (ids: rbfa-{matchId}).
 * Does not delete manual events or trainings.
 */
export async function syncRbfaCalendar() {
  const teamId = getRbfaTeamId();
  const matches = await fetchRbfaMatchEvents(teamId);

  if (matches.length === 0) {
    return {
      success: true,
      teamId,
      fetched: 0,
      inserted: 0,
      updated: 0,
      unchanged: 0,
      events: [],
    };
  }

  const supabase = createAdminClient();
  const ids = matches.map((match) => match.id);

  const { data: existingRows, error: existingError } = await supabase
    .from("events")
    .select("*")
    .in("id", ids);

  if (existingError) {
    throw existingError;
  }

  const existingById = new Map((existingRows ?? []).map((row) => [row.id, row]));

  let inserted = 0;
  let updated = 0;
  let unchanged = 0;
  const upsertRows = [];

  for (const match of matches) {
    const existing = existingById.get(match.id);

    if (!existing) {
      inserted += 1;
      upsertRows.push(eventToRow(match));
      continue;
    }

    if (isSameMatch(existing, match)) {
      unchanged += 1;
      continue;
    }

    updated += 1;
    upsertRows.push(eventToRow(match));
  }

  if (upsertRows.length > 0) {
    const { error: upsertError } = await supabase.from("events").upsert(upsertRows, {
      onConflict: "id",
    });

    if (upsertError) {
      throw upsertError;
    }
  }

  const { data: syncedRows, error: syncedError } = await supabase
    .from("events")
    .select("*")
    .in("id", ids)
    .order("date");

  if (syncedError) {
    throw syncedError;
  }

  return {
    success: true,
    teamId,
    fetched: matches.length,
    inserted,
    updated,
    unchanged,
    events: (syncedRows ?? []).map(rowToEvent),
  };
}
