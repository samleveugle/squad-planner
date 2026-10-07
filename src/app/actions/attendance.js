"use server";

import { attendanceDraftToRows, rowsToAttendanceMap } from "@/lib/attendance";
import { requireAdminPlayer, requireAuthPlayer } from "@/lib/auth";
import { statsPayloadToRows } from "@/lib/stats-db";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getEventAttendance() {
  const auth = await requireAuthPlayer();

  if (!auth.success) {
    return { success: false, attendance: {}, error: auth.error };
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("event_attendance")
      .select("event_id, player_id, attended, minutes");

    if (error) {
      throw error;
    }

    return {
      success: true,
      attendance: rowsToAttendanceMap(data ?? []),
    };
  } catch (error) {
    return {
      success: false,
      attendance: {},
      error: error?.message ?? "Kon aanwezigheid niet laden.",
    };
  }
}

function normalizeSavedMatchScore(score) {
  if (score == null) {
    return { skip: true };
  }

  const forEmpty = score.scoreFor == null;
  const againstEmpty = score.scoreAgainst == null;

  if (forEmpty && againstEmpty) {
    return { skip: false, scoreFor: null, scoreAgainst: null };
  }

  if (forEmpty || againstEmpty) {
    return { error: "Vul beide scores in of laat beide leeg." };
  }

  const scoreFor = Number.parseInt(String(score.scoreFor), 10);
  const scoreAgainst = Number.parseInt(String(score.scoreAgainst), 10);

  if (
    !Number.isInteger(scoreFor) ||
    !Number.isInteger(scoreAgainst) ||
    scoreFor < 0 ||
    scoreAgainst < 0
  ) {
    return { error: "Score moet 0 of hoger zijn." };
  }

  return { skip: false, scoreFor, scoreAgainst };
}

/**
 * Save post-event attendance for one event.
 * For matches, optionally also upsert match_stats from statsPayload
 * and the match score (scoreFor / scoreAgainst).
 *
 * @param {object} params
 * @param {string} params.eventId
 * @param {'training'|'match'} params.eventType
 * @param {Record<string, {attended:boolean, minutes?:number|null}>} params.draft
 * @param {Record<string, {goals:number, assists:number, yellowCards?:number, redCards?:number}>} [params.statsPayload]
 * @param {{scoreFor:number|null, scoreAgainst:number|null}|null} [params.score]
 */
export async function saveEventAttendance({
  eventId,
  eventType,
  draft,
  statsPayload = {},
  score = undefined,
}) {
  const auth = await requireAdminPlayer();

  if (!auth.success) {
    return { success: false, error: auth.error };
  }

  if (!eventId) {
    return { success: false, error: "Event ontbreekt." };
  }

  if (eventType !== "training" && eventType !== "match") {
    return { success: false, error: "Ongeldig eventtype." };
  }

  try {
    const supabase = createAdminClient();
    const rows = attendanceDraftToRows(eventId, eventType, draft);

    const { error: deleteError } = await supabase
      .from("event_attendance")
      .delete()
      .eq("event_id", eventId);

    if (deleteError) {
      throw deleteError;
    }

    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from("event_attendance")
        .insert(rows);

      if (insertError) {
        throw insertError;
      }
    }

    if (eventType === "match") {
      const normalizedScore = normalizeSavedMatchScore(score);

      if (normalizedScore.error) {
        return { success: false, error: normalizedScore.error };
      }

      if (!normalizedScore.skip) {
        const { error: scoreError } = await supabase
          .from("events")
          .update({
            score_for: normalizedScore.scoreFor,
            score_against: normalizedScore.scoreAgainst,
          })
          .eq("id", eventId)
          .eq("type", "match");

        if (scoreError) {
          throw scoreError;
        }
      }

      const statsRows = statsPayloadToRows(eventId, statsPayload);

      const { error: statsDeleteError } = await supabase
        .from("match_stats")
        .delete()
        .eq("event_id", eventId);

      if (statsDeleteError) {
        throw statsDeleteError;
      }

      if (statsRows.length > 0) {
        const { error: statsInsertError } = await supabase
          .from("match_stats")
          .insert(statsRows);

        if (statsInsertError) {
          throw statsInsertError;
        }
      }
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error?.message ?? "Kon aanwezigheid niet opslaan.",
    };
  }
}
