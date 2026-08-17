const STORAGE_PREFIX = "squad-planner-seen-lineups-";

export function getSeenLineupsStorageKey(playerId) {
  return `${STORAGE_PREFIX}${playerId}`;
}

export function readStoredSeenLineups(playerId) {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(getSeenLineupsStorageKey(playerId));

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

export function writeStoredSeenLineups(playerId, seenLineups) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    getSeenLineupsStorageKey(playerId),
    JSON.stringify(seenLineups)
  );
}

export function isPublishedLineupUnseen(lineup, seenLineups, eventId) {
  if (!lineup?.published || !lineup.publishedAt) {
    return false;
  }

  return seenLineups[eventId] !== lineup.publishedAt;
}
