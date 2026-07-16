"use server";

import { requireAdminPlayer, requireAuthPlayer } from "@/lib/auth";
import { lineupToRow, rowsToLineupsMap } from "@/lib/lineups-db";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getLineups() {
  const auth = await requireAuthPlayer();

  if (!auth.success) {
    return { success: false, lineups: {}, error: auth.error };
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("lineups").select("*");

    if (error) {
      throw error;
    }

    return {
      success: true,
      lineups: rowsToLineupsMap(data ?? []),
    };
  } catch (error) {
    return {
      success: false,
      lineups: {},
      error: error?.message ?? "Kon opstellingen niet laden.",
    };
  }
}

export async function saveLineup(eventId, lineupData) {
  const auth = await requireAdminPlayer();

  if (!auth.success) {
    return { success: false, error: auth.error };
  }

  if (!eventId || !lineupData) {
    return { success: false, error: "Event of opstelling ontbreekt." };
  }

  try {
    const supabase = createAdminClient();
    const { data: existing, error: fetchError } = await supabase
      .from("lineups")
      .select("published, published_at")
      .eq("event_id", eventId)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    const row = lineupToRow(eventId, {
      ...lineupData,
      published: existing?.published ?? lineupData.published ?? false,
      publishedAt: existing?.published_at ?? lineupData.publishedAt ?? null,
    });

    const { error } = await supabase.from("lineups").upsert(row, {
      onConflict: "event_id",
    });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error?.message ?? "Kon opstelling niet opslaan.",
    };
  }
}

export async function publishLineup(eventId, lineupData) {
  const auth = await requireAdminPlayer();

  if (!auth.success) {
    return { success: false, error: auth.error };
  }

  if (!eventId || !lineupData) {
    return { success: false, error: "Event of opstelling ontbreekt." };
  }

  try {
    const supabase = createAdminClient();
    const publishedAt = new Date().toISOString();
    const row = lineupToRow(eventId, {
      ...lineupData,
      published: true,
      publishedAt,
    });

    const { error } = await supabase.from("lineups").upsert(row, {
      onConflict: "event_id",
    });

    if (error) {
      throw error;
    }

    return { success: true, publishedAt };
  } catch (error) {
    return {
      success: false,
      error: error?.message ?? "Kon opstelling niet publiceren.",
    };
  }
}

export async function unpublishLineup(eventId) {
  const auth = await requireAdminPlayer();

  if (!auth.success) {
    return { success: false, error: auth.error };
  }

  if (!eventId) {
    return { success: false, error: "Event ontbreekt." };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("lineups")
      .update({
        published: false,
        updated_at: new Date().toISOString(),
      })
      .eq("event_id", eventId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error?.message ?? "Kon opstelling niet verbergen.",
    };
  }
}
