"use server";

import {
  isValidAvailabilityStatus,
  resolveLateAbsent,
  rowsToLateAbsencesMap,
  rowsToResponsesMap,
} from "@/lib/availability";
import { requireAuthPlayer } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getAvailabilityResponses() {
  const auth = await requireAuthPlayer();

  if (!auth.success) {
    return {
      success: false,
      responses: {},
      lateAbsences: {},
      error: auth.error,
    };
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("availability")
      .select("player_id, event_id, status, late_absent");

    if (error) {
      throw error;
    }

    const rows = data ?? [];

    return {
      success: true,
      responses: rowsToResponsesMap(rows),
      lateAbsences: rowsToLateAbsencesMap(rows),
    };
  } catch (error) {
    return {
      success: false,
      responses: {},
      lateAbsences: {},
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

    const [{ data: eventRow, error: eventError }, { data: existing, error: existingError }] =
      await Promise.all([
        supabase.from("events").select("id, type, date").eq("id", eventId).maybeSingle(),
        supabase
          .from("availability")
          .select("status, late_absent")
          .eq("player_id", playerId)
          .eq("event_id", eventId)
          .maybeSingle(),
      ]);

    if (eventError) {
      throw eventError;
    }

    if (existingError) {
      throw existingError;
    }

    const lateAbsent = resolveLateAbsent({
      event: eventRow,
      previousStatus: existing?.status ?? null,
      nextStatus: status,
      previousLateAbsent: Boolean(existing?.late_absent),
    });

    const { error } = await supabase.from("availability").upsert(
      {
        player_id: playerId,
        event_id: eventId,
        status,
        late_absent: lateAbsent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "player_id,event_id" }
    );

    if (error) {
      throw error;
    }

    return { success: true, lateAbsent };
  } catch (error) {
    return {
      success: false,
      error: error?.message ?? "Kon beschikbaarheid niet opslaan.",
    };
  }
}
