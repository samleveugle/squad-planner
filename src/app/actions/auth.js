"use server";

import { redirect } from "next/navigation";

import {
  getAuthCallbackUrl,
  getCurrentPlayer,
  getPlayerByEmail,
  getPlayerRegistrationEligibility,
  getSiteUrl,
  linkPlayerToAuthUser,
} from "@/lib/auth";
import { debugLog } from "@/lib/debug-log";
import { validatePasswordForm } from "@/lib/password";
import { createClient } from "@/lib/supabase/server";

function normalizeEmail(email) {
  return email?.trim().toLowerCase() ?? "";
}

export async function signInWithEmailPassword(email, password) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    return { success: false, error: "Vul e-mail en wachtwoord in." };
  }

  try {
    const player = await getPlayerByEmail(normalizedEmail);

    if (!player) {
      return { success: false, error: "Ongeldige inloggegevens." };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      return { success: false, error: "Ongeldige inloggegevens." };
    }

    const currentPlayer = await getCurrentPlayer();

    if (!currentPlayer) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: "Inloggen mislukt. Neem contact op met je admin.",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error?.message ?? "Kon niet inloggen.",
    };
  }

  redirect("/");
}

export async function registerWithEmailPassword(email, password, confirmPassword) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return { success: false, error: "Vul je e-mailadres in." };
  }

  const passwordResult = validatePasswordForm(password, confirmPassword);

  if (!passwordResult.valid) {
    return { success: false, error: passwordResult.error };
  }

  try {
    const eligibility = await getPlayerRegistrationEligibility(normalizedEmail);

    if (!eligibility.allowed) {
      return { success: false, error: eligibility.error };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: getAuthCallbackUrl("/"),
      },
    });

    if (error) {
      if (error.message?.toLowerCase().includes("already registered")) {
        return {
          success: false,
          error:
            "Dit account is al geregistreerd. Log in of gebruik wachtwoord vergeten.",
        };
      }
      throw error;
    }

    if (!data.user) {
      return { success: false, error: "Registratie mislukt. Probeer opnieuw." };
    }

    const linkedPlayer = await linkPlayerToAuthUser(data.user);

    if (!linkedPlayer) {
      return {
        success: false,
        error: "Account kon niet gekoppeld worden. Neem contact op met je admin.",
      };
    }

    if (!data.session) {
      return {
        success: true,
        message: "Account aangemaakt. Bevestig je e-mail en log daarna in.",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error?.message ?? "Kon account niet aanmaken.",
    };
  }

  redirect("/");
}

export async function requestPasswordReset(email) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return { success: false, error: "Vul je e-mailadres in." };
  }

  try {
    const player = await getPlayerByEmail(normalizedEmail);

    if (!player) {
      return {
        success: false,
        error: "Geen account voor dit e-mailadres. Vraag je admin om toegang.",
      };
    }

    const redirectTo = `${getSiteUrl()}/auth/callback/recovery`;

    // #region agent log
    debugLog(
      "auth.js:requestPasswordReset",
      "sending reset",
      { redirectTo },
      "B"
    );
    // #endregion

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo,
    });

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: `Resetlink verstuurd naar ${normalizedEmail}. Check ook je spam.`,
    };
  } catch (error) {
    return {
      success: false,
      error: error?.message ?? "Kon resetlink niet versturen.",
    };
  }
}

export async function updatePassword(newPassword, confirmPassword) {
  const passwordResult = validatePasswordForm(newPassword, confirmPassword);

  if (!passwordResult.valid) {
    return { success: false, error: passwordResult.error };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Sessie verlopen. Vraag een nieuwe resetlink aan.",
      };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      throw error;
    }
  } catch (error) {
    return {
      success: false,
      error: error?.message ?? "Kon wachtwoord niet bijwerken.",
    };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
