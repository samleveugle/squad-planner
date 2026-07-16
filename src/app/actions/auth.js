"use server";

import { redirect } from "next/navigation";

import { getPlayerByEmail, getSiteUrl } from "@/lib/auth";
import { debugLog, formatFetchError, getEnvDiagnostics } from "@/lib/debug-log";
import { createClient } from "@/lib/supabase/server";

export async function sendMagicLink(email) {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return { success: false, error: "Vul je e-mailadres in." };
  }

  let step = "init";

  // #region agent log
  debugLog("auth.js:sendMagicLink", "start", { ...getEnvDiagnostics(), step }, "B");
  // #endregion

  try {
    step = "player-lookup";
    const player = await getPlayerByEmail(normalizedEmail);

    // #region agent log
    debugLog(
      "auth.js:sendMagicLink",
      "player-lookup ok",
      { step, foundPlayer: Boolean(player) },
      "C"
    );
    // #endregion

    if (!player) {
      return {
        success: false,
        error: "Geen account voor dit e-mailadres. Vraag je admin om toegang.",
      };
    }

    step = "signInWithOtp";
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
      },
    });

    if (error) {
      throw error;
    }

    // #region agent log
    debugLog("auth.js:sendMagicLink", "signInWithOtp ok", { step }, "D");
    // #endregion

    return {
      success: true,
      message: `Loginlink verstuurd naar ${normalizedEmail}. Check ook je spam.`,
    };
  } catch (error) {
    const details = formatFetchError(error, step);

    // #region agent log
    debugLog("auth.js:sendMagicLink", "failed", details, step === "player-lookup" ? "C" : "D");
    // #endregion

    const causeSuffix = details.causeCode ? ` (${details.causeCode})` : "";

    return {
      success: false,
      error: `[debug ${details.step}] ${details.message ?? "Kon loginlink niet versturen."}${causeSuffix}`,
      debug: details,
    };
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
