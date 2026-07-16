"use server";

import { requireAdminPlayer, requireAuthPlayer } from "@/lib/auth";
import { eventToRow, rowToEvent } from "@/lib/events-db";
import { sortEventsByDate, toEventId } from "@/lib/events";
import { createAdminClient } from "@/lib/supabase/admin";

function normalizeTime(time) {
  const trimmed = time?.trim();
  return trimmed || null;
}

function validateEventInput({ type, date, location, isHome }) {
  if (type !== "training" && type !== "match") {
    return "Type moet training of wedstrijd zijn.";
  }

  if (!date?.trim()) {
    return "Datum is verplicht.";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
    return "Datum moet YYYY-MM-DD zijn.";
  }

  if (!location?.trim()) {
    return "Locatie is verplicht.";
  }

  if (type === "match" && typeof isHome !== "boolean") {
    return "Kies thuis of uit voor een wedstrijd.";
  }

  return null;
}

export async function getEvents() {
  const auth = await requireAuthPlayer();

  if (!auth.success) {
    return { success: false, events: [], error: auth.error };
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("date");

    if (error) {
      throw error;
    }

    return {
      success: true,
      events: sortEventsByDate((data ?? []).map(rowToEvent)),
    };
  } catch (error) {
    return {
      success: false,
      events: [],
      error: error?.message ?? "Kon events niet laden.",
    };
  }
}

export async function createEvent({
  type,
  date,
  time,
  location,
  isHome,
  opponent,
}) {
  const auth = await requireAdminPlayer();

  if (!auth.success) {
    return { success: false, error: auth.error };
  }

  const normalizedDate = date?.trim();
  const validationError = validateEventInput({
    type,
    date: normalizedDate,
    location,
    isHome: type === "match" ? Boolean(isHome) : undefined,
  });

  if (validationError) {
    return { success: false, error: validationError };
  }

  const eventId = toEventId({
    type,
    date: normalizedDate,
    isHome: Boolean(isHome),
  });

  const event = {
    id: eventId,
    type,
    date: normalizedDate,
    time: normalizeTime(time),
    location: location.trim(),
    isHome: type === "match" ? Boolean(isHome) : undefined,
    opponent: opponent?.trim() || null,
  };

  try {
    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        error: "Er bestaat al een event met deze combinatie (datum/type).",
      };
    }

    const { data, error } = await supabase
      .from("events")
      .insert(eventToRow(event))
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "Dit event bestaat al." };
      }
      throw error;
    }

    return { success: true, event: rowToEvent(data) };
  } catch (error) {
    return {
      success: false,
      error: error?.message ?? "Kon event niet toevoegen.",
    };
  }
}

export async function updateEvent(eventId, updates) {
  const auth = await requireAdminPlayer();

  if (!auth.success) {
    return { success: false, error: auth.error };
  }

  if (!eventId) {
    return { success: false, error: "Event ontbreekt." };
  }

  try {
    const supabase = createAdminClient();

    const { data: currentRow, error: fetchError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (fetchError || !currentRow) {
      return { success: false, error: "Event niet gevonden." };
    }

    const current = rowToEvent(currentRow);
    const nextType = updates.type ?? current.type;
    const nextDate = updates.date?.trim() ?? current.date;
    const nextLocation =
      updates.location !== undefined ? updates.location.trim() : current.location;
    const nextIsHome =
      nextType === "match"
        ? updates.isHome !== undefined
          ? Boolean(updates.isHome)
          : Boolean(current.isHome)
        : undefined;

    const validationError = validateEventInput({
      type: nextType,
      date: nextDate,
      location: nextLocation,
      isHome: nextIsHome,
    });

    if (validationError) {
      return { success: false, error: validationError };
    }

    const event = {
      id: eventId,
      type: nextType,
      date: nextDate,
      time:
        updates.time !== undefined ? normalizeTime(updates.time) : current.time,
      location: nextLocation,
      isHome: nextIsHome,
      opponent:
        updates.opponent !== undefined
          ? updates.opponent?.trim() || null
          : current.opponent,
    };

    const { data, error } = await supabase
      .from("events")
      .update(eventToRow(event))
      .eq("id", eventId)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return { success: true, event: rowToEvent(data) };
  } catch (error) {
    return {
      success: false,
      error: error?.message ?? "Kon event niet bijwerken.",
    };
  }
}

export async function deleteEvent(eventId) {
  const auth = await requireAdminPlayer();

  if (!auth.success) {
    return { success: false, error: auth.error };
  }

  if (!eventId) {
    return { success: false, error: "Event ontbreekt." };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("events").delete().eq("id", eventId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error?.message ?? "Kon event niet verwijderen.",
    };
  }
}
