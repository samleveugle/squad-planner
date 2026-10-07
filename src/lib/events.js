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

export const CLUB_NAME = "Fc Hoje";

export function getOpponentName(event) {
  return event?.opponent?.trim() || "Tegenstander";
}

function hasMatchScore(event) {
  if (event?.type !== "match") {
    return false;
  }

  if (!Number.isInteger(event.scoreFor) || !Number.isInteger(event.scoreAgainst)) {
    return false;
  }

  return event.scoreFor >= 0 && event.scoreAgainst >= 0;
}

function formatMatchScore(event) {
  if (!hasMatchScore(event)) {
    return null;
  }

  if (event.isHome) {
    return `${event.scoreFor}-${event.scoreAgainst}`;
  }

  return `${event.scoreAgainst}-${event.scoreFor}`;
}

function formatMatchResult(event) {
  if (!hasMatchScore(event)) {
    return null;
  }

  if (event.scoreFor > event.scoreAgainst) {
    return "winst";
  }

  if (event.scoreFor < event.scoreAgainst) {
    return "verlies";
  }

  return "gelijk";
}

export function formatMatchScoreLine(event) {
  const score = formatMatchScore(event);
  const result = formatMatchResult(event);

  if (!score || !result) {
    return null;
  }

  return `${score} (${result})`;
}

export function parseMatchScore(scoreFor, scoreAgainst) {
  const forEmpty = scoreFor === "" || scoreFor == null;
  const againstEmpty = scoreAgainst === "" || scoreAgainst == null;

  if (forEmpty && againstEmpty) {
    return { ok: true, scoreFor: null, scoreAgainst: null };
  }

  if (forEmpty || againstEmpty) {
    return { ok: false, error: "Vul beide scores in of laat beide leeg." };
  }

  const parsedFor = Number.parseInt(String(scoreFor), 10);
  const parsedAgainst = Number.parseInt(String(scoreAgainst), 10);

  if (
    !Number.isInteger(parsedFor) ||
    !Number.isInteger(parsedAgainst) ||
    parsedFor < 0 ||
    parsedAgainst < 0
  ) {
    return { ok: false, error: "Score moet 0 of hoger zijn." };
  }

  return { ok: true, scoreFor: parsedFor, scoreAgainst: parsedAgainst };
}

export function toClubScore({ isHome, homeGoals, awayGoals }) {
  const parsed = parseMatchScore(homeGoals, awayGoals);

  if (!parsed.ok) {
    return parsed;
  }

  if (parsed.scoreFor == null && parsed.scoreAgainst == null) {
    return { ok: true, scoreFor: null, scoreAgainst: null };
  }

  if (isHome) {
    return {
      ok: true,
      scoreFor: parsed.scoreFor,
      scoreAgainst: parsed.scoreAgainst,
    };
  }

  return {
    ok: true,
    scoreFor: parsed.scoreAgainst,
    scoreAgainst: parsed.scoreFor,
  };
}

export function toHomeAwayGoals(event) {
  if (event?.isHome) {
    return {
      homeGoals: event.scoreFor ?? null,
      awayGoals: event.scoreAgainst ?? null,
    };
  }

  return {
    homeGoals: event.scoreAgainst ?? null,
    awayGoals: event.scoreFor ?? null,
  };
}

export function getEventMatchDetail(event) {
  if (event.type !== "match") {
    return null;
  }

  if (event.isHome) {
    return event.opponent ? `Thuis vs ${event.opponent}` : "Thuiswedstrijd";
  }

  return event.opponent ? `Uit vs ${event.opponent}` : "Verplaatsing (TBD)";
}

export function getEventTypeLabel(event) {
  if (event.type === "training") {
    return "Training";
  }

  if (event.type === "evenement") {
    return event.title?.trim() || "Evenement";
  }

  if (event.type === "match") {
    return "Wedstrijd";
  }

  return "Event";
}

export function getEventTitle(event) {
  const matchDetail = getEventMatchDetail(event);

  if (matchDetail) {
    return matchDetail;
  }

  return getEventTypeLabel(event);
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
