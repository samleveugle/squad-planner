import { getBrusselsDateString } from "@/lib/brussels-time";
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

export function rowsToLateAbsencesMap(rows) {
  return rows.reduce((lateAbsences, row) => {
    if (row.late_absent) {
      const responseKey = getResponseKey(row.player_id, row.event_id);
      lateAbsences[responseKey] = true;
    }
    return lateAbsences;
  }, {});
}

export function isLastMinuteTrainingPullout({
  event,
  previousStatus,
  nextStatus,
  at = new Date(),
}) {
  if (event?.type !== "training" || !event.date) {
    return false;
  }

  if (previousStatus !== "present") {
    return false;
  }

  if (nextStatus !== "doubt" && nextStatus !== "absent") {
    return false;
  }

  return getBrusselsDateString(at) >= event.date;
}

export function resolveLateAbsent({
  event,
  previousStatus,
  nextStatus,
  previousLateAbsent = false,
  at = new Date(),
}) {
  if (nextStatus === "present") {
    return false;
  }

  if (
    isLastMinuteTrainingPullout({
      event,
      previousStatus,
      nextStatus,
      at,
    })
  ) {
    return true;
  }

  return Boolean(previousLateAbsent) && (nextStatus === "doubt" || nextStatus === "absent");
}
