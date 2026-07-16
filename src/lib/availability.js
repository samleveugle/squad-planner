import { getResponseKey } from "@/lib/mock-data";

const VALID_STATUSES = new Set(["present", "doubt", "absent"]);

export function isValidAvailabilityStatus(status) {
  return VALID_STATUSES.has(status);
}

export function rowsToResponsesMap(rows) {
  return rows.reduce((responses, row) => {
    const responseKey = getResponseKey(row.player_id, row.event_id);
    responses[responseKey] = row.status;
    return responses;
  }, {});
}
