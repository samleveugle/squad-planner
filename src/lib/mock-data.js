export const AVAILABILITY = {
  present: { label: "Aanwezig", shortLabel: "Aanwezig" },
  doubt: { label: "Twijfel", shortLabel: "Twijfel" },
  absent: { label: "Afwezig", shortLabel: "Afwezig" },
};

export const PLAYERS = [
  { id: "1", name: "Senne", isAdmin: true },
  { id: "2", name: "Jan", isAdmin: true },
  { id: "3", name: "Pieter", isAdmin: false },
  { id: "4", name: "Tom", isAdmin: false },
  { id: "5", name: "Lucas", isAdmin: false },
  { id: "6", name: "Max", isAdmin: false },
];

export const EVENTS = [
  {
    id: "t1",
    type: "training",
    date: "2026-06-10",
    time: "19:30",
    location: "Sporthal De Vliet",
  },
  {
    id: "t2",
    type: "training",
    date: "2026-06-12",
    time: "19:30",
    location: "Sporthal De Vliet",
  },
  {
    id: "m1",
    type: "match",
    date: "2026-06-14",
    time: "14:00",
    location: "Uit — FC Rivier",
    opponent: "FC Rivier",
  },
];

export function getEventTitle(event) {
  if (event.type === "match") {
    return `Wedstrijd vs ${event.opponent}`;
  }
  return "Training";
}

export function formatEventDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  return date.toLocaleDateString("nl-BE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function getPlayerById(playerId) {
  return PLAYERS.find((player) => player.id === playerId);
}

export function getResponseKey(playerId, eventId) {
  return `${playerId}-${eventId}`;
}
