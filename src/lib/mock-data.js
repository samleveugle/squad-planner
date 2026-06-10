export const AVAILABILITY = {
  present: { label: "Aanwezig", shortLabel: "Aanwezig" },
  doubt: { label: "Twijfel", shortLabel: "Twijfel" },
  absent: { label: "Afwezig", shortLabel: "Afwezig" },
};

export const SEASON = {
  start: "2026-08-06",
  end: "2027-04-29",
  training: {
    weekday: 4,
    time: "20:30",
    location: "SK Laar",
  },
  homeMatch: {
    time: "10:30",
    location: "SK Laar",
  },
};

const ADMIN_NAMES = ["Sam", "Jalle", "Gijs", "Senne"];

const PLAYER_NAMES = [
  "Massi",
  "Sakke",
  "Achiel",
  "Apo",
  "Woesti",
  "Batti",
  "Bomme",
  "Brico",
  "Brunt",
  "Bulle",
  "PJ",
  "Ceesj",
  "Dealek",
  "Denzel",
  "Dockx",
  "Demaeyer",
  "Jacky",
  "Raket",
  "Joris",
  "Scheers",
  "Jelle",
  "Dakke",
  "Simon",
  "Doolhof",
];

function toPlayerId(name) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function createPlayer(name, isAdmin) {
  return { id: toPlayerId(name), name, isAdmin };
}

export const PLAYERS = [
  ...ADMIN_NAMES.map((name) => createPlayer(name, true)),
  ...PLAYER_NAMES.map((name) => createPlayer(name, false)),
];

function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(dateString) {
  return new Date(`${dateString}T12:00:00`);
}

function generateSeasonEvents() {
  const events = [];
  const seasonStart = parseDate(SEASON.start);
  const seasonEnd = parseDate(SEASON.end);

  const trainingDate = new Date(seasonStart);
  while (trainingDate.getDay() !== SEASON.training.weekday) {
    trainingDate.setDate(trainingDate.getDate() + 1);
  }

  while (trainingDate <= seasonEnd) {
    const date = toDateString(trainingDate);
    events.push({
      id: `training-${date}`,
      type: "training",
      date,
      time: SEASON.training.time,
      location: SEASON.training.location,
    });
    trainingDate.setDate(trainingDate.getDate() + 7);
  }

  const matchDate = new Date(seasonStart);
  while (matchDate.getDay() !== 0) {
    matchDate.setDate(matchDate.getDate() + 1);
  }

  let isHomeMatch = true;
  while (matchDate <= seasonEnd) {
    const date = toDateString(matchDate);

    if (isHomeMatch) {
      events.push({
        id: `match-home-${date}`,
        type: "match",
        isHome: true,
        date,
        time: SEASON.homeMatch.time,
        location: SEASON.homeMatch.location,
        opponent: null,
      });
    } else {
      events.push({
        id: `match-away-${date}`,
        type: "match",
        isHome: false,
        date,
        time: null,
        location: "Verplaatsing",
        opponent: null,
      });
    }

    isHomeMatch = !isHomeMatch;
    matchDate.setDate(matchDate.getDate() + 7);
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export const EVENTS = generateSeasonEvents();

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
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const currentWeekStart = getWeekStart(today);
  if (getEventsForWeek(events, currentWeekStart).length > 0) {
    return currentWeekStart;
  }

  const todayString = toDateString(today);
  const nextEvent = events.find((event) => event.date >= todayString);

  if (nextEvent) {
    return getWeekStart(parseDate(nextEvent.date));
  }

  const lastEvent = events[events.length - 1];
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

export function getPlayerById(playerId) {
  return PLAYERS.find((player) => player.id === playerId);
}

export function getResponseKey(playerId, eventId) {
  return `${playerId}-${eventId}`;
}

export function getPlayersByStatus(eventId, responses, status) {
  return PLAYERS.filter(
    (player) => responses[getResponseKey(player.id, eventId)] === status
  );
}

export function getEventResponseSummary(eventId, responses) {
  const present = getPlayersByStatus(eventId, responses, "present");
  const doubt = getPlayersByStatus(eventId, responses, "doubt");
  const absent = getPlayersByStatus(eventId, responses, "absent");
  const unanswered = PLAYERS.filter(
    (player) => !responses[getResponseKey(player.id, eventId)]
  );

  return { present, doubt, absent, unanswered };
}
