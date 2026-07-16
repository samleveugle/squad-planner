"use server";

import { isValidAvailabilityStatus, rowsToResponsesMap } from "@/lib/availability";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getAvailabilityResponses() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("availability")
      .select("player_id, event_id, status");

    if (error) {
      throw error;
    }

    return {
      success: true,
      responses: rowsToResponsesMap(data ?? []),
    };
  } catch (error) {
    return {
      success: false,
      responses: {},
      error: error?.message ?? "Kon beschikbaarheid niet laden.",
    };
  }
}

export async function saveAvailability(playerId, eventId, status) {
  if (!playerId || !eventId) {
    return { success: false, error: "Speler of event ontbreekt." };
  }

  if (!isValidAvailabilityStatus(status)) {
    return { success: false, error: "Ongeldige status." };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("availability").upsert(
      {
        player_id: playerId,
        event_id: eventId,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "player_id,event_id" }
    );

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error?.message ?? "Kon beschikbaarheid niet opslaan.",
    };
  }
}
