export function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDate(dateString) {
  return new Date(`${dateString}T12:00:00`);
}

function slugifyTitle(title) {
  const slug = (title ?? "event")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 40);

  return slug || "event";
}

export function toEventId({ type, date, isHome, title }) {
  if (type === "training") {
    return `training-${date}`;
  }

  if (type === "evenement") {
    return `evenement-${date}-${slugifyTitle(title)}`;
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

export function getEventWeekRange(events) {
  const sorted = sortEventsByDate(events);

  if (sorted.length === 0) {
    const current = getWeekStart(new Date());
    return { first: current, last: current };
  }

  return {
    first: getWeekStart(parseDate(sorted[0].date)),
    last: getWeekStart(parseDate(sorted[sorted.length - 1].date)),
  };
}

export function getWeekStartsInRange(startWeek, endWeek) {
  const weeks = [];
  let current = getWeekStart(startWeek);
  const end = getWeekStart(endWeek);

  while (current.getTime() <= end.getTime()) {
    weeks.push(new Date(current));
    current = addWeeks(current, 1);
  }

  return weeks;
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
  // Always open on the current week. Past weeks are reached via navigator only.
  void events;
  return getWeekStart(new Date());
}

export function getEventTitle(event) {
  if (event.type === "training") {
    return "Training";
  }

  if (event.type === "evenement") {
    return event.title?.trim() || "Evenement";
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
