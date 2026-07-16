export function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDate(dateString) {
  return new Date(`${dateString}T12:00:00`);
}

export function toEventId({ type, date, isHome }) {
  if (type === "training") {
    return `training-${date}`;
  }

  return isHome ? `match-home-${date}` : `match-away-${date}`;
}

export function sortEventsByDate(events) {
  return [...events].sort((a, b) => a.date.localeCompare(b.date));
}

export function getWeekStart(date) {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + diff);
  weekStart.setHours(12, 0, 0, 0);
  return weekStart;
}

export function addWeeks(date, weeks) {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}

export function getEventsForWeek(events, weekStart) {
  const weekEnd = addWeeks(weekStart, 1);
  weekEnd.setDate(weekEnd.getDate() - 1);

  const weekStartString = toDateString(weekStart);
  const weekEndString = toDateString(weekEnd);

  return events.filter(
    (event) => event.date >= weekStartString && event.date <= weekEndString
  );
}

export function formatWeekRange(weekStart) {
  const weekEnd = addWeeks(weekStart, 1);
  weekEnd.setDate(weekEnd.getDate() - 1);

  const startLabel = weekStart.toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "short",
  });
  const endLabel = weekEnd.toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${startLabel} – ${endLabel}`;
}

export function getDefaultWeekStart(events) {
  const sorted = sortEventsByDate(events);

  if (sorted.length === 0) {
    return getWeekStart(new Date());
  }

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const currentWeekStart = getWeekStart(today);
  if (getEventsForWeek(sorted, currentWeekStart).length > 0) {
    return currentWeekStart;
  }

  const todayString = toDateString(today);
  const nextEvent = sorted.find((event) => event.date >= todayString);

  if (nextEvent) {
    return getWeekStart(parseDate(nextEvent.date));
  }

  const lastEvent = sorted[sorted.length - 1];
  return getWeekStart(parseDate(lastEvent.date));
}

export function getEventTitle(event) {
  if (event.type === "training") {
    return "Training";
  }

  if (event.isHome) {
    return event.opponent ? `Thuis vs ${event.opponent}` : "Thuiswedstrijd";
  }

  return event.opponent ? `Uit vs ${event.opponent}` : "Verplaatsing (TBD)";
}

export function formatEventDate(dateString) {
  const date = parseDate(dateString);
  return date.toLocaleDateString("nl-BE", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

export function formatEventTime(event) {
  if (!event.time) {
    return "uur TBD";
  }
  return event.time.replace(":", "u");
}

export function getEventTypeLabel(type) {
  return type === "training" ? "Training" : "Wedstrijd";
}

export function getEventLocationSummary(event) {
  if (event.type === "match") {
    return event.isHome ? "Thuis" : "Uit";
  }
  return event.location;
}
