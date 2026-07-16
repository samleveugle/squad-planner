"use server";

import { requireAdminPlayer, requireAuthPlayer } from "@/lib/auth";
import { rowToPlayer } from "@/lib/players-db";
import { sortPlayersByName, toPlayerId } from "@/lib/players";
import { createAdminClient } from "@/lib/supabase/admin";

function normalizeEmail(email) {
  const trimmed = email?.trim().toLowerCase();
  return trimmed || null;
}

export async function getPlayers() {
  const auth = await requireAuthPlayer();

  if (!auth.success) {
    return { success: false, players: [], error: auth.error };
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .order("name");

    if (error) {
      throw error;
    }

    return {
      success: true,
      players: sortPlayersByName((data ?? []).map(rowToPlayer)),
    };
  } catch (error) {
    return {
      success: false,
      players: [],
      error: error?.message ?? "Kon spelers niet laden.",
    };
  }
}

export async function createPlayer({ name, isAdmin, isSquadPlayer, email }) {
  const auth = await requireAdminPlayer();

  if (!auth.success) {
    return { success: false, error: auth.error };
  }

  const trimmedName = name?.trim();

  if (!trimmedName) {
    return { success: false, error: "Naam is verplicht." };
  }

  const playerId = toPlayerId(trimmedName);
  const normalizedEmail = normalizeEmail(email);

  try {
    const supabase = createAdminClient();

    if (normalizedEmail) {
      const { data: existingEmail } = await supabase
        .from("players")
        .select("id")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (existingEmail) {
        return { success: false, error: "Dit e-mailadres is al in gebruik." };
      }
    }

    const { data, error } = await supabase
      .from("players")
      .insert({
        id: playerId,
        name: trimmedName,
        is_admin: Boolean(isAdmin),
        is_squad_player: isSquadPlayer !== false,
        email: normalizedEmail,
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "Deze speler bestaat al." };
      }
      throw error;
    }

    return { success: true, player: rowToPlayer(data) };
  } catch (error) {
    return {
      success: false,
      error: error?.message ?? "Kon speler niet toevoegen.",
    };
  }
}

export async function updatePlayer(playerId, updates) {
  const auth = await requireAdminPlayer();

  if (!auth.success) {
    return { success: false, error: auth.error };
  }

  if (!playerId) {
    return { success: false, error: "Speler ontbreekt." };
  }

  const payload = {};

  if (updates.name !== undefined) {
    const trimmedName = updates.name.trim();
    if (!trimmedName) {
      return { success: false, error: "Naam is verplicht." };
    }
    payload.name = trimmedName;
  }

  if (updates.isAdmin !== undefined) {
    payload.is_admin = Boolean(updates.isAdmin);
  }

  if (updates.isSquadPlayer !== undefined) {
    payload.is_squad_player = Boolean(updates.isSquadPlayer);
  }

  if (updates.email !== undefined) {
    payload.email = normalizeEmail(updates.email);
  }

  try {
    const supabase = createAdminClient();

    if (payload.email) {
      const { data: existingEmail } = await supabase
        .from("players")
        .select("id")
        .eq("email", payload.email)
        .neq("id", playerId)
        .maybeSingle();

      if (existingEmail) {
        return { success: false, error: "Dit e-mailadres is al in gebruik." };
      }
    }

    const { data, error } = await supabase
      .from("players")
      .update(payload)
      .eq("id", playerId)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return { success: true, player: rowToPlayer(data) };
  } catch (error) {
    return {
      success: false,
      error: error?.message ?? "Kon speler niet bijwerken.",
    };
  }
}

export async function deletePlayer(playerId) {
  const auth = await requireAdminPlayer();

  if (!auth.success) {
    return { success: false, error: auth.error };
  }

  if (!playerId) {
    return { success: false, error: "Speler ontbreekt." };
  }

  if (playerId === auth.player.id) {
    return { success: false, error: "Je kunt jezelf niet verwijderen." };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("players").delete().eq("id", playerId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error?.message ?? "Kon speler niet verwijderen.",
    };
  }
}
