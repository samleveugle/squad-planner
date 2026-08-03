export const FORMATIONS = {
  "4-3-3": {
    label: "4-3-3",
    positions: [
      { id: "st", label: "SP", x: 50, y: 8 },
      { id: "lw", label: "LA", x: 18, y: 18 },
      { id: "rw", label: "RA", x: 82, y: 18 },
      // 10 = CAM (hoog), 8 = box-to-box, 6 = CDM (laag)
      { id: "cm3", label: "10", x: 50, y: 28 },
      { id: "cm1", label: "8", x: 28, y: 40 },
      { id: "cm2", label: "6", x: 58, y: 50 },
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
      { id: "lm", label: "LM", x: 12, y: 32 },
      { id: "rm", label: "RM", x: 88, y: 32 },
      // Centraal midfield: 10 / 8 / 6
      { id: "cm3", label: "10", x: 50, y: 28 },
      { id: "cm1", label: "8", x: 32, y: 42 },
      { id: "cm2", label: "6", x: 58, y: 50 },
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
      // Centraal midfield: 10 / 8 / 6
      { id: "cm3", label: "10", x: 50, y: 28 },
      { id: "cm1", label: "8", x: 30, y: 40 },
      { id: "cm2", label: "6", x: 58, y: 48 },
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

function slotDistance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

/**
 * Remap field players to a new formation.
 * 1) Keep same slot ids when possible
 * 2) Place remaining players on the nearest free slot (by x/y)
 * Preserves all previous field players when both formations have 11 slots.
 *
 * @param {Record<string, string|null>} previousPositions
 * @param {string} newFormationId
 * @param {string} [previousFormationId]
 */
export function migratePositions(
  previousPositions,
  newFormationId,
  previousFormationId = DEFAULT_FORMATION
) {
  const previousFormation = getFormation(previousFormationId);
  const nextFormation = getFormation(newFormationId);
  const nextPositions = createEmptyPositions(newFormationId);
  const usedPlayers = new Set();

  const occupied = [];
  const seenPlayers = new Set();

  for (const slot of previousFormation.positions) {
    const playerId = previousPositions?.[slot.id] ?? null;
    if (playerId && !seenPlayers.has(playerId)) {
      occupied.push({ playerId, slot });
      seenPlayers.add(playerId);
    }
  }

  for (const [slotId, playerId] of Object.entries(previousPositions ?? {})) {
    if (!playerId || seenPlayers.has(playerId)) {
      continue;
    }
    const known = previousFormation.positions.find((s) => s.id === slotId);
    occupied.push({
      playerId,
      slot: known ?? { id: slotId, x: 50, y: 50 },
    });
    seenPlayers.add(playerId);
  }

  // Pass 1: exact slot id match
  for (const item of occupied) {
    if (
      Object.prototype.hasOwnProperty.call(nextPositions, item.slot.id) &&
      nextPositions[item.slot.id] === null &&
      !usedPlayers.has(item.playerId)
    ) {
      nextPositions[item.slot.id] = item.playerId;
      usedPlayers.add(item.playerId);
    }
  }

  // Pass 2: nearest free slot by pitch coordinates
  const remaining = occupied.filter((item) => !usedPlayers.has(item.playerId));

  for (const item of remaining) {
    let bestSlotId = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const slot of nextFormation.positions) {
      if (nextPositions[slot.id] !== null) {
        continue;
      }
      const distance = slotDistance(item.slot, slot);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestSlotId = slot.id;
      }
    }

    if (bestSlotId) {
      nextPositions[bestSlotId] = item.playerId;
      usedPlayers.add(item.playerId);
    }
  }

  return nextPositions;
}

export function countFilledPositions(positions) {
  return Object.values(positions).filter(Boolean).length;
}

export function getAssignedPlayerIds(positions) {
  return Object.values(positions).filter(Boolean);
}
