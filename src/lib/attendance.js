function createEmptyAttendance() {
  return { attended: false, minutes: null };
}

export function rowsToAttendanceMap(rows) {
  return (rows ?? []).reduce((map, row) => {
    if (!map[row.event_id]) {
      map[row.event_id] = {};
    }

    map[row.event_id][row.player_id] = {
      attended: Boolean(row.attended),
      minutes: row.minutes ?? null,
    };

    return map;
  }, {});
}

export function getPlayerAttendance(attendance, eventId, playerId) {
  return attendance[eventId]?.[playerId] ?? createEmptyAttendance();
}

export function parseMinutes(value) {
  if (value === "" || value == null) {
    return null;
  }
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

/**
 * Build DB rows from UI draft.
 * @param {string} eventId
 * @param {'training'|'match'} eventType
 * @param {Record<string, {attended:boolean, minutes?:number|null}>} draft
 */
export function attendanceDraftToRows(eventId, eventType, draft) {
  const now = new Date().toISOString();

  return Object.entries(draft ?? {}).map(([playerId, entry]) => {
    const attended = Boolean(entry?.attended);
    let minutes = null;

    if (eventType === "match" && attended) {
      minutes = parseMinutes(entry?.minutes) ?? 90;
    }

    return {
      event_id: eventId,
      player_id: playerId,
      attended,
      minutes,
      updated_at: now,
    };
  });
}

export function createAttendanceDraft(attendance, eventId, playerIds) {
  const draft = {};
  for (const playerId of playerIds) {
    draft[playerId] = {
      ...getPlayerAttendance(attendance, eventId, playerId),
    };
  }
  return draft;
}

export function hasRecordedAttendance(attendance, eventId) {
  const eventAttendance = attendance[eventId];
  if (!eventAttendance) {
    return false;
  }
  return Object.values(eventAttendance).some((entry) => entry.attended);
}

export function getPlayerSeasonAttendance(attendance, playerId, events) {
  const trainings = [];
  const matches = [];

  for (const event of events) {
    const entry = getPlayerAttendance(attendance, event.id, playerId);
    if (!entry.attended) {
      continue;
    }

    if (event.type === "training") {
      trainings.push({ event, minutes: null });
    } else if (event.type === "match") {
      matches.push({ event, minutes: entry.minutes ?? 0 });
    }
  }

  trainings.sort((a, b) => b.event.date.localeCompare(a.event.date));
  matches.sort((a, b) => b.event.date.localeCompare(a.event.date));

  const totalMinutes = matches.reduce((sum, item) => sum + (item.minutes ?? 0), 0);

  return {
    trainings,
    matches,
    trainingCount: trainings.length,
    matchCount: matches.length,
    totalMinutes,
  };
}
