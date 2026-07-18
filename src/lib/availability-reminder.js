import { isValidAvailabilityStatus } from "@/lib/availability";
import { addWeeks, getEventsForWeek, getWeekStart, toDateString } from "@/lib/events";
import { getResponseKey } from "@/lib/mock-data";

export const AVAILABILITY_REMINDER_MESSAGE =
  "Vergeet je aanwezigheid voor komende week niet in te vullen.";

export function getUpcomingWeekStart(fromDate = new Date()) {
  const date = new Date(fromDate);
  date.setHours(12, 0, 0, 0);
  return addWeeks(getWeekStart(date), 1);
}

export function getWeekStartKey(weekStart) {
  return toDateString(getWeekStart(weekStart));
}

export function buildResponsesMap(rows) {
  return rows.reduce((responses, row) => {
    responses[getResponseKey(row.player_id, row.event_id)] = row.status;
    return responses;
  }, {});
}

export function playerHasCompleteAvailability(playerId, weekEvents, responses) {
  return weekEvents.every((event) => {
    const status = responses[getResponseKey(playerId, event.id)];
    return isValidAvailabilityStatus(status);
  });
}

export function getIncompleteSquadPlayerIds({
  players,
  events,
  responses,
  weekStart,
  pushEnabledPlayerIds,
}) {
  const weekEvents = getEventsForWeek(events, weekStart);

  if (weekEvents.length === 0) {
    return [];
  }

  const pushEnabled = new Set(pushEnabledPlayerIds);

  return players
    .filter((player) => {
      if (!player.isSquadPlayer || !player.authUserId) {
        return false;
      }

      if (!pushEnabled.has(player.id)) {
        return false;
      }

      return !playerHasCompleteAvailability(player.id, weekEvents, responses);
    })
    .map((player) => player.id);
}
