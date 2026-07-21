"use server";

import { requireAdminPlayer } from "@/lib/auth";
import { getEvents } from "@/app/actions/events";
import { syncRbfaCalendar } from "@/lib/rbfa-sync";

export async function syncRbfaCalendarAction() {
  const auth = await requireAdminPlayer();

  if (!auth.success) {
    return { success: false, error: auth.error };
  }

  try {
    const result = await syncRbfaCalendar();
    const eventsResult = await getEvents();

    return {
      success: true,
      fetched: result.fetched,
      inserted: result.inserted,
      updated: result.updated,
      unchanged: result.unchanged,
      teamId: result.teamId,
      events: eventsResult.success ? eventsResult.events : result.events,
      error: eventsResult.success ? null : eventsResult.error,
    };
  } catch (error) {
    return {
      success: false,
      error: error?.message ?? "Kon RBFA-kalender niet synchroniseren.",
    };
  }
}
