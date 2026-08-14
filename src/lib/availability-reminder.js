import { addWeeks, getEventsForWeek, getWeekStart, toDateString } from "@/lib/events";
import { getPushEnabledSquadPlayerIds } from "@/lib/push-recipients";

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

export function getAvailabilityReminderRecipientIds({
  players,
  events,
  weekStart,
  pushEnabledPlayerIds,
}) {
  const weekEvents = getEventsForWeek(events, weekStart);

  if (weekEvents.length === 0) {
    return [];
  }

  return getPushEnabledSquadPlayerIds({ players, pushEnabledPlayerIds });
}
