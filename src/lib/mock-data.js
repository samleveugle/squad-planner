import { parseDate, toDateString } from "./events.js";

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

const ADMINS = [
  { name: "Pol", isSquadPlayer: false },
  { name: "Gijs", isSquadPlayer: false },
  { name: "Sam", isSquadPlayer: true },
  { name: "Massi", isSquadPlayer: true },
  { name: "Senne", isSquadPlayer: true },
];

const PLAYER_NAMES = [
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
  "Jalle",
  "Kobalt",
  "Pirre",
  "Siebe",
];

function toPlayerId(name) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function createPlayer(name, { isAdmin = false, isSquadPlayer = true } = {}) {
  return { id: toPlayerId(name), name, isAdmin, isSquadPlayer };
}

export const PLAYERS = [
  ...ADMINS.map(({ name, isSquadPlayer }) =>
    createPlayer(name, { isAdmin: true, isSquadPlayer })
  ),
  ...PLAYER_NAMES.map((name) => createPlayer(name)),
];

export const SQUAD_PLAYERS = PLAYERS.filter((player) => player.isSquadPlayer);

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

/** Alleen voor db:seed — runtime laadt events uit Supabase */
export const EVENTS = generateSeasonEvents();

export function getResponseKey(playerId, eventId) {
  return `${playerId}-${eventId}`;
}

export {
  addWeeks,
  formatEventDate,
  formatEventTime,
  formatWeekRange,
  getDefaultWeekStart,
  getEventTitle,
  getEventsForWeek,
  getWeekStart,
} from "./events.js";
