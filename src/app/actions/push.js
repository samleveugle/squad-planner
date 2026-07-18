"use server";

import { requireAuthPlayer } from "@/lib/auth";
import { rowToPushPreference } from "@/lib/push-db";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getPushPreference() {
  const auth = await requireAuthPlayer();

  if (!auth.success) {
    return { success: false, enabled: false, error: auth.error };
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("push_preferences")
      .select("player_id, enabled, updated_at")
      .eq("player_id", auth.player.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const preference = rowToPushPreference(data);

    return {
      success: true,
      enabled: preference?.enabled ?? false,
    };
  } catch (error) {
    return {
      success: false,
      enabled: false,
      error: error?.message ?? "Kon meldingsvoorkeur niet laden.",
    };
  }
}

export async function setPushEnabled(enabled) {
  const auth = await requireAuthPlayer();

  if (!auth.success) {
    return { success: false, error: auth.error };
  }

  if (!auth.player.isSquadPlayer) {
    return {
      success: false,
      error: "Alleen ploegspelers kunnen meldingen ontvangen.",
    };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("push_preferences").upsert(
      {
        player_id: auth.player.id,
        enabled: Boolean(enabled),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "player_id" }
    );

    if (error) {
      throw error;
    }

    return { success: true, enabled: Boolean(enabled) };
  } catch (error) {
    return {
      success: false,
      error: error?.message ?? "Kon meldingsvoorkeur niet opslaan.",
    };
  }
}
