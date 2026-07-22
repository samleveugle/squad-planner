import { addWeeks, getWeekStart, toDateString, toEventId } from "@/lib/events";
import { getResponseKey } from "@/lib/mock-data";

const DEMO_READ_ONLY_MESSAGE =
  "Demo-modus: alleen bekijken. Wijzigingen worden niet opgeslagen.";

const OPPONENTS = [
  "FC Noordzee",
  "SK Molenbeek",
  "United Bridge",
  "Racing Harbor",
  "VV Parkstad",
  "ASC Riverside",
  "Olympic West",
  "FC Horizon",
];

/** Fictieve ploeg (~25) voor CV/demo — geen echte personen */
const DEMO_PLAYER_DEFS = [
  { id: "demo-alex", name: "Alex Rivera", isAdmin: true, isSquadPlayer: true },
  { id: "demo-jordan", name: "Jordan Blake", isAdmin: false, isSquadPlayer: true },
  { id: "demo-casey", name: "Casey Morgan", isAdmin: false, isSquadPlayer: true },
  { id: "demo-riley", name: "Riley Quinn", isAdmin: false, isSquadPlayer: true },
  { id: "demo-taylor", name: "Taylor Brooks", isAdmin: false, isSquadPlayer: true },
  { id: "demo-morgan", name: "Morgan Ellis", isAdmin: false, isSquadPlayer: true },
  { id: "demo-avery", name: "Avery Shaw", isAdmin: false, isSquadPlayer: true },
  { id: "demo-parker", name: "Parker Lane", isAdmin: false, isSquadPlayer: true },
  { id: "demo-cameron", name: "Cameron Reid", isAdmin: false, isSquadPlayer: true },
  { id: "demo-drew", name: "Drew Harper", isAdmin: false, isSquadPlayer: true },
  { id: "demo-jamie", name: "Jamie Cole", isAdmin: false, isSquadPlayer: true },
  { id: "demo-rowan", name: "Rowan Hayes", isAdmin: false, isSquadPlayer: true },
  { id: "demo-sage", name: "Sage Patton", isAdmin: false, isSquadPlayer: true },
  { id: "demo-quinn", name: "Quinn Adler", isAdmin: false, isSquadPlayer: true },
  { id: "demo-finley", name: "Finley Crowe", isAdmin: false, isSquadPlayer: true },
  { id: "demo-harley", name: "Harley Vance", isAdmin: false, isSquadPlayer: true },
  { id: "demo-skyler", name: "Skyler Moss", isAdmin: false, isSquadPlayer: true },
  { id: "demo-remy", name: "Remy Frost", isAdmin: false, isSquadPlayer: true },
  { id: "demo-blake", name: "Blake Ortega", isAdmin: false, isSquadPlayer: true },
  { id: "demo-phoenix", name: "Phoenix Dale", isAdmin: false, isSquadPlayer: true },
  { id: "demo-kennedy", name: "Kennedy Wells", isAdmin: false, isSquadPlayer: true },
  { id: "demo-logan", name: "Logan Pierce", isAdmin: false, isSquadPlayer: true },
  { id: "demo-charlie", name: "Charlie West", isAdmin: false, isSquadPlayer: true },
  { id: "demo-sam", name: "Sam Ortega", isAdmin: true, isSquadPlayer: false },
  { id: "demo-chris", name: "Chris Nolan", isAdmin: true, isSquadPlayer: false },
];

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function dateOnWeekday(weekStart, weekday) {
  // weekStart = Monday; weekday 0=Sun..6=Sat → offset from Monday
  const mondayBased = weekday === 0 ? 6 : weekday - 1;
  return addDays(weekStart, mondayBased);
}

function buildEventsAroundToday() {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const thisWeek = getWeekStart(today);
  const events = [];

  for (let weekOffset = -2; weekOffset <= 4; weekOffset += 1) {
    const week = addWeeks(thisWeek, weekOffset);
    const trainingDate = dateOnWeekday(week, 4);
    const matchDate = dateOnWeekday(week, 0);
    const trainingStr = toDateString(trainingDate);
    const matchStr = toDateString(matchDate);
    const isHome = weekOffset % 2 === 0;
    const opponent = OPPONENTS[(weekOffset + 2) % OPPONENTS.length];

    events.push({
      id: toEventId({ type: "training", date: trainingStr }),
      type: "training",
      date: trainingStr,
      time: "20:30",
      location: "Sportpark Demo",
    });

    events.push({
      id: toEventId({ type: "match", date: matchStr, isHome }),
      type: "match",
      date: matchStr,
      time: isHome ? "10:30" : "15:00",
      location: isHome ? "Sportpark Demo" : "Uitstadion",
      isHome,
      opponent,
    });
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

function buildAvailability(players, events) {
  const squad = players.filter((p) => p.isSquadPlayer);
  const statuses = ["present", "present", "present", "doubt", "absent"];
  const responses = {};

  for (const event of events) {
    squad.forEach((player, index) => {
      // Leave a few empty for realism on future events
      if (event.date > toDateString(new Date()) && index % 7 === 0) {
        return;
      }
      const status = statuses[(index + event.date.length) % statuses.length];
      responses[getResponseKey(player.id, event.id)] = status;
    });
  }

  // Viewer (Alex) always present for upcoming events
  const viewerId = "demo-alex";
  for (const event of events) {
    if (event.date >= toDateString(new Date())) {
      responses[getResponseKey(viewerId, event.id)] = "present";
    }
  }

  return responses;
}

function buildLineupForMatch(matchEvent, players) {
  const squad = players.filter((p) => p.isSquadPlayer);
  const ids = squad.map((p) => p.id);

  const positions = {
    st: ids[1],
    lw: ids[2],
    rw: ids[3],
    cm1: ids[4],
    cm2: ids[5],
    cm3: ids[6],
    lb: ids[7],
    cb1: ids[8],
    cb2: ids[9],
    rb: ids[10],
    gk: ids[11],
  };

  const bench = [ids[12], ids[13], ids[14], ids[15], ids[16]].filter(Boolean);
  const staff = players.filter((p) => p.isAdmin && !p.isSquadPlayer).map((p) => p.id).slice(0, 2);

  const numbers = {};
  let n = 1;
  for (const id of [...Object.values(positions), ...bench]) {
    if (id) {
      numbers[id] = n;
      n += 1;
    }
  }

  return {
    formation: "4-3-3",
    positions,
    bench,
    staff,
    numbers,
    published: true,
    publishedAt: new Date().toISOString(),
  };
}

function buildLineups(events, players) {
  const lineups = {};
  const matches = events.filter((e) => e.type === "match");
  const today = toDateString(new Date());

  // Publish lineup for nearest upcoming match + last past match
  const past = [...matches].filter((e) => e.date < today).at(-1);
  const upcoming = matches.find((e) => e.date >= today);

  for (const match of [past, upcoming].filter(Boolean)) {
    lineups[match.id] = buildLineupForMatch(match, players);
  }

  return lineups;
}

function buildMatchStats(events, players) {
  const matchStats = {};
  const today = toDateString(new Date());
  const pastMatches = events.filter((e) => e.type === "match" && e.date < today).slice(-3);
  const squad = players.filter((p) => p.isSquadPlayer);

  pastMatches.forEach((match, matchIndex) => {
    const stats = {};
    squad.slice(0, 14).forEach((player, index) => {
      const goals = (index + matchIndex) % 5 === 0 ? 1 : 0;
      const assists = (index + matchIndex) % 7 === 0 ? 1 : 0;
      if (goals > 0 || assists > 0 || index < 11) {
        stats[player.id] = { goals, assists };
      }
    });
    // Give demo viewer some stats
    stats["demo-alex"] = { goals: 1 + (matchIndex % 2), assists: matchIndex % 2 };
    matchStats[match.id] = stats;
  });

  return matchStats;
}

export function getDemoCurrentPlayer() {
  return {
    id: "demo-alex",
    name: "Alex Rivera",
    isAdmin: true,
    isSquadPlayer: true,
    email: null,
  };
}

/**
 * Volledige in-memory snapshot voor /demo (geen Supabase).
 */
export function getDemoSnapshot() {
  const players = DEMO_PLAYER_DEFS.map((p) => ({ ...p, email: null }));
  const events = buildEventsAroundToday();
  const responses = buildAvailability(players, events);
  const lineups = buildLineups(events, players);
  const matchStats = buildMatchStats(events, players);

  return {
    players,
    events,
    responses,
    lineups,
    matchStats,
    currentPlayer: getDemoCurrentPlayer(),
  };
}

export { DEMO_READ_ONLY_MESSAGE };
