import { parseDate, toDateString } from "@/lib/events";

function getSeasonStartYearFromDate(date) {
  const month = date.getMonth();
  const year = date.getFullYear();
  return month >= 7 ? year : year - 1;
}

function getSeasonIdFromDate(dateInput) {
  const date =
    typeof dateInput === "string" ? parseDate(dateInput) : new Date(dateInput);
  const startYear = getSeasonStartYearFromDate(date);
  return `${startYear}-${startYear + 1}`;
}

export function getCurrentSeasonId(date = new Date()) {
  return getSeasonIdFromDate(date);
}

export function getSeasonBounds(seasonId) {
  const startYear = Number.parseInt(seasonId.split("-")[0], 10);
  if (Number.isNaN(startYear)) {
    throw new Error(`Invalid season id: ${seasonId}`);
  }

  return {
    start: `${startYear}-08-01`,
    end: `${startYear + 1}-04-30`,
  };
}

export function formatSeasonLabel(seasonId) {
  return `Seizoen ${seasonId}`;
}

export function getAvailableSeasonIds({ events = [], today = new Date() } = {}) {
  const currentSeasonId = getCurrentSeasonId(today);
  let earliestStartYear = Number.parseInt(currentSeasonId.split("-")[0], 10);

  for (const event of events) {
    if (event.type !== "training" && event.type !== "match") {
      continue;
    }

    const eventStartYear = getSeasonStartYearFromDate(parseDate(event.date));
    if (eventStartYear < earliestStartYear) {
      earliestStartYear = eventStartYear;
    }
  }

  const currentStartYear = Number.parseInt(currentSeasonId.split("-")[0], 10);
  const seasons = [];

  for (let year = earliestStartYear; year <= currentStartYear; year += 1) {
    seasons.push(`${year}-${year + 1}`);
  }

  return seasons.reverse();
}

export function filterEventsForSeasonStats(events, seasonId, today = new Date()) {
  const todayString = toDateString(today);
  const { start, end } = getSeasonBounds(seasonId);

  return events.filter(
    (event) =>
      (event.type === "training" || event.type === "match") &&
      event.date >= start &&
      event.date <= end &&
      event.date <= todayString
  );
}

export function getSeasonMatchEventIds(events, seasonId, today = new Date()) {
  return new Set(
    filterEventsForSeasonStats(events, seasonId, today)
      .filter((event) => event.type === "match")
      .map((event) => event.id)
  );
}
