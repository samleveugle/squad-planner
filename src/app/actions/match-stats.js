"use server";

import { requireAuthPlayer } from "@/lib/auth";
import { rowsToMatchStatsMap } from "@/lib/stats-db";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getMatchStats() {
  const auth = await requireAuthPlayer();

  if (!auth.success) {
    return { success: false, matchStats: {}, error: auth.error };
  }

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
