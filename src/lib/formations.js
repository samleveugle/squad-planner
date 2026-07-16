export const FORMATIONS = {
  "4-3-3": {
    label: "4-3-3",
    positions: [
      { id: "st", label: "SP", x: 50, y: 8 },
      { id: "lw", label: "LA", x: 18, y: 18 },
      { id: "rw", label: "RA", x: 82, y: 18 },
      { id: "cm1", label: "CM", x: 25, y: 38 },
      { id: "cm2", label: "CM", x: 50, y: 42 },
      { id: "cm3", label: "CM", x: 75, y: 38 },
      { id: "lb", label: "LV", x: 12, y: 58 },
      { id: "cb1", label: "CV", x: 35, y: 62 },
      { id: "cb2", label: "CV", x: 65, y: 62 },
      { id: "rb", label: "RV", x: 88, y: 58 },
      { id: "gk", label: "K", x: 50, y: 82 },
    ],
  },
  "4-4-2": {
    label: "4-4-2",
    positions: [
      { id: "st1", label: "SP", x: 38, y: 10 },
      { id: "st2", label: "SP", x: 62, y: 10 },
      { id: "lm", label: "LM", x: 12, y: 38 },
      { id: "cm1", label: "CM", x: 38, y: 42 },
      { id: "cm2", label: "CM", x: 62, y: 42 },
      { id: "rm", label: "RM", x: 88, y: 38 },
      { id: "lb", label: "LV", x: 12, y: 58 },
      { id: "cb1", label: "CV", x: 35, y: 62 },
      { id: "cb2", label: "CV", x: 65, y: 62 },
      { id: "rb", label: "RV", x: 88, y: 58 },
      { id: "gk", label: "K", x: 50, y: 82 },
    ],
  },
  "3-5-2": {
    label: "3-5-2",
    positions: [
      { id: "st1", label: "SP", x: 38, y: 10 },
      { id: "st2", label: "SP", x: 62, y: 10 },
      { id: "lm", label: "LM", x: 12, y: 35 },
      { id: "cm1", label: "CM", x: 30, y: 42 },
      { id: "cm2", label: "CM", x: 50, y: 45 },
      { id: "cm3", label: "CM", x: 70, y: 42 },
      { id: "rm", label: "RM", x: 88, y: 35 },
      { id: "cb1", label: "CV", x: 28, y: 62 },
      { id: "cb2", label: "CV", x: 50, y: 66 },
      { id: "cb3", label: "CV", x: 72, y: 62 },
      { id: "gk", label: "K", x: 50, y: 82 },
    ],
  },
  "5-3-2": {
    label: "5-3-2",
    positions: [
      { id: "st1", label: "SP", x: 38, y: 10 },
      { id: "st2", label: "SP", x: 62, y: 10 },
      { id: "cm1", label: "CM", x: 30, y: 40 },
      { id: "cm2", label: "CM", x: 50, y: 44 },
      { id: "cm3", label: "CM", x: 70, y: 40 },
      { id: "lwb", label: "LV", x: 10, y: 56 },
      { id: "cb1", label: "CV", x: 28, y: 62 },
      { id: "cb2", label: "CV", x: 50, y: 66 },
      { id: "cb3", label: "CV", x: 72, y: 62 },
      { id: "rwb", label: "RV", x: 90, y: 56 },
      { id: "gk", label: "K", x: 50, y: 82 },
    ],
  },
};


export const DEFAULT_FORMATION = "4-3-3";

export function getFormationIds() {
  return Object.keys(FORMATIONS);
}

export function getFormation(formationId) {
  return FORMATIONS[formationId] ?? FORMATIONS[DEFAULT_FORMATION];
}

export function createEmptyPositions(formationId) {
  const formation = getFormation(formationId);
  return Object.fromEntries(formation.positions.map((slot) => [slot.id, null]));
}

export function migratePositions(previousPositions, newFormationId) {
  const formation = getFormation(newFormationId);
  const usedPlayers = new Set();

  const positions = Object.fromEntries(
    formation.positions.map((slot) => {
      const playerId = previousPositions?.[slot.id] ?? null;
      if (playerId && !usedPlayers.has(playerId)) {
        usedPlayers.add(playerId);
        return [slot.id, playerId];
      }
      return [slot.id, null];
    })
  );

  return positions;
}

export function countFilledPositions(positions) {
  return Object.values(positions).filter(Boolean).length;
}

export function getAssignedPlayerIds(positions) {
  return Object.values(positions).filter(Boolean);
}
