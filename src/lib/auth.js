import { rowToPlayer } from "@/lib/players-db";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function normalizeEmail(email) {
  return email?.trim().toLowerCase() ?? "";
}

export async function linkPlayerToAuthUser(user) {
  if (!user?.id || !user.email) {
    return null;
  }

  const email = normalizeEmail(user.email);
  const admin = createAdminClient();

  const { data: player, error } = await admin
    .from("players")
    .update({ auth_user_id: user.id })
    .eq("email", email)
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return player ? rowToPlayer(player) : null;
}

export async function getCurrentPlayer() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const admin = createAdminClient();

  const { data: byAuthId, error: authError } = await admin
    .from("players")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (authError) {
    throw authError;
  }

  if (byAuthId) {
    return rowToPlayer(byAuthId);
  }

  if (!user.email) {
    return null;
  }

  const email = normalizeEmail(user.email);
  const { data: byEmail, error: emailError } = await admin
    .from("players")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (emailError) {
    throw emailError;
  }

  if (!byEmail) {
    return null;
  }

  const { data: linked, error: linkError } = await admin
    .from("players")
    .update({ auth_user_id: user.id })
    .eq("id", byEmail.id)
    .select("*")
    .single();

  if (linkError) {
    throw linkError;
  }

  return rowToPlayer(linked);
}

export async function requireAuthPlayer() {
  const player = await getCurrentPlayer();

  if (!player) {
    return { success: false, error: "Niet ingelogd.", player: null };
  }

  return { success: true, player, error: null };
}

export async function requireAdminPlayer() {
  const auth = await requireAuthPlayer();

  if (!auth.success) {
    return auth;
  }

  if (!auth.player.isAdmin) {
    return {
      success: false,
      player: auth.player,
      error: "Geen admin-rechten.",
    };
  }

  return auth;
}

export async function getPlayerByEmail(email) {
  const admin = createAdminClient();
  const normalized = normalizeEmail(email);

  if (!normalized) {
    return null;
  }

  const { data, error } = await admin
    .from("players")
    .select("id, name, email, auth_user_id")
    .eq("email", normalized)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getPlayerRegistrationEligibility(email) {
  const player = await getPlayerByEmail(email);

  if (!player) {
    return {
      allowed: false,
      error: "Geen account voor dit e-mailadres. Vraag je admin om toegang.",
    };
  }

  if (player.auth_user_id) {
    return {
      allowed: false,
      error:
        "Dit account is al geregistreerd. Log in of gebruik wachtwoord vergeten.",
    };
  }

  return { allowed: true, player, error: null };
}

export function getAuthCallbackUrl(nextPath = "/") {
  const siteUrl = getSiteUrl();
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  const params = new URLSearchParams({ next });
  return `${siteUrl}/auth/callback?${params.toString()}`;
}

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "http://localhost:3000"
  );
}
