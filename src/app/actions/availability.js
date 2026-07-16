"use server";

import { isValidAvailabilityStatus, rowsToResponsesMap } from "@/lib/availability";
import { requireAuthPlayer } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getAvailabilityResponses() {
  const auth = await requireAuthPlayer();

  if (!auth.success) {
    return { success: false, responses: {}, error: auth.error };
  }

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

export async function saveAvailability(eventId, status) {
  const auth = await requireAuthPlayer();

  if (!auth.success) {
    return { success: false, error: auth.error };
  }

  const playerId = auth.player.id;

  if (!eventId) {
    return { success: false, error: "Event ontbreekt." };
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
