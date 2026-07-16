"use server";

import { rowsToMatchStatsMap, statsPayloadToRows } from "@/lib/stats-db";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getMatchStats() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("match_stats")
      .select("event_id, player_id, goals, assists");

    if (error) {
      throw error;
    }

    return {
      success: true,
      matchStats: rowsToMatchStatsMap(data ?? []),
    };
  } catch (error) {
    return {
      success: false,
      matchStats: {},
      error: error?.message ?? "Kon stats niet laden.",
    };
  }
}

export async function saveMatchStats(eventId, statsPayload) {
  if (!eventId) {
    return { success: false, error: "Event ontbreekt." };
  }

  try {
    const supabase = createAdminClient();
    const rows = statsPayloadToRows(eventId, statsPayload);

    const { error: deleteError } = await supabase
      .from("match_stats")
      .delete()
      .eq("event_id", eventId);

    if (deleteError) {
      throw deleteError;
    }

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from("match_stats").insert(rows);

      if (insertError) {
        throw insertError;
      }
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error?.message ?? "Kon stats niet opslaan.",
    };
  }
}
