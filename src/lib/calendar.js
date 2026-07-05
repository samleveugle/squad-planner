import { SEASON } from "@/lib/mock-data";

function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(dateString) {
  return new Date(`${dateString}T12:00:00`);
}

export function isDateInSeason(dateString) {
  return dateString >= SEASON.start && dateString <= SEASON.end;
}

export function isMonthInSeason(year, month) {
  const firstDay = toDateString(new Date(year, month, 1));
  const lastDay = toDateString(new Date(year, month + 1, 0));
  return lastDay >= SEASON.start && firstDay <= SEASON.end;
}

export function getEventsForDate(events, dateString) {
  return events.filter((event) => event.date === dateString);
}

export function getEventsForMonth(events, year, month) {
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  return events.filter((event) => event.date.startsWith(monthPrefix));
}

export function getMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  let startOffset = firstOfMonth.getDay() - 1;
  if (startOffset < 0) {
    startOffset = 6;
  }

  const gridStart = new Date(year, month, 1 - startOffset);
  const todayString = toDateString(new Date());
  const cells = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    date.setHours(12, 0, 0, 0);

    const dateString = toDateString(date);

    cells.push({
      date,
      dateString,
      dayNumber: date.getDate(),
      inMonth: date.getMonth() === month,
      inSeason: isDateInSeason(dateString),
      isToday: dateString === todayString,
    });
  }

  return cells;
}

export function getDefaultMonth() {
  const todayString = toDateString(new Date());
  if (isDateInSeason(todayString)) {
    const today = parseDate(todayString);
    return { year: today.getFullYear(), month: today.getMonth() };
  }

  const seasonStart = parseDate(SEASON.start);
  return { year: seasonStart.getFullYear(), month: seasonStart.getMonth() };
}

export function addMonths(year, month, delta) {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function formatMonthYear(year, month) {
  return new Date(year, month, 1).toLocaleDateString("nl-BE", {
    month: "long",
    year: "numeric",
  });
}

export function getEventMarkers(events) {
  const hasTraining = events.some((event) => event.type === "training");
  const hasHomeMatch = events.some(
    (event) => event.type === "match" && event.isHome
  );
  const hasAwayMatch = events.some(
    (event) => event.type === "match" && !event.isHome
  );

  return { hasTraining, hasHomeMatch, hasAwayMatch };
}

export const WEEKDAY_LABELS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
