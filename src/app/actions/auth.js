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
import { toAuthUserMessage } from "@/lib/auth-errors";
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

  // #region agent log
  fetch("http://127.0.0.1:7891/ingest/2b6b089d-7eb8-434a-b07c-a2e87411d81f", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "d077e5",
    },
    body: JSON.stringify({
      sessionId: "d077e5",
      runId: "pre-fix",
      hypothesisId: "H3",
      location: "auth.js:requestPasswordReset:entry",
      message: "requestPasswordReset called",
      data: { hasEmail: Boolean(normalizedEmail), emailLength: normalizedEmail.length },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (!normalizedEmail) {
    return { success: false, error: "Vul je e-mailadres in." };
  }

  try {
    const player = await getPlayerByEmail(normalizedEmail);

    // #region agent log
    fetch("http://127.0.0.1:7891/ingest/2b6b089d-7eb8-434a-b07c-a2e87411d81f", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "d077e5",
      },
      body: JSON.stringify({
        sessionId: "d077e5",
        runId: "pre-fix",
        hypothesisId: "H2",
        location: "auth.js:requestPasswordReset:player",
        message: "player lookup result",
        data: {
          playerFound: Boolean(player),
          hasAuthUserId: Boolean(player?.auth_user_id),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (!player) {
      return {
        success: false,
        error: "Geen account voor dit e-mailadres. Vraag je admin om toegang.",
      };
    }

    if (!player.auth_user_id) {
      return {
        success: false,
        error:
          "Je account is nog niet geregistreerd. Ga eerst naar Registreren om een wachtwoord in te stellen.",
      };
    }

    const redirectTo = `${getSiteUrl()}/auth/callback/recovery`;

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo,
    });

    // #region agent log
    fetch("http://127.0.0.1:7891/ingest/2b6b089d-7eb8-434a-b07c-a2e87411d81f", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "d077e5",
      },
      body: JSON.stringify({
        sessionId: "d077e5",
        runId: "pre-fix",
        hypothesisId: "H5",
        location: "auth.js:requestPasswordReset:supabase",
        message: "supabase resetPasswordForEmail result",
        data: {
          hasError: Boolean(error),
          errorType: error ? typeof error : null,
          errorMessageType: error?.message != null ? typeof error.message : null,
          errorMessageIsArray: Array.isArray(error?.message),
          errorName: error?.name ?? null,
          errorCode: error?.code ?? null,
          redirectToHost: redirectTo.split("/")[2] ?? null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (error) {
      throw error;
    }

    const successResult = {
      success: true,
      message: `Resetlink verstuurd naar ${normalizedEmail}. Check ook je spam.`,
    };

    // #region agent log
    fetch("http://127.0.0.1:7891/ingest/2b6b089d-7eb8-434a-b07c-a2e87411d81f", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "d077e5",
      },
      body: JSON.stringify({
        sessionId: "d077e5",
        runId: "pre-fix",
        hypothesisId: "H3",
        location: "auth.js:requestPasswordReset:success",
        message: "returning success",
        data: { success: true },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return successResult;
  } catch (error) {
    const failResult = {
      success: false,
      error: toAuthUserMessage(error, "Kon resetlink niet versturen."),
    };

    // #region agent log
    fetch("http://127.0.0.1:7891/ingest/2b6b089d-7eb8-434a-b07c-a2e87411d81f", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "d077e5",
      },
      body: JSON.stringify({
        sessionId: "d077e5",
        runId: "pre-fix",
        hypothesisId: "H1-H5",
        location: "auth.js:requestPasswordReset:catch",
        message: "returning failure",
        data: {
          caughtType: typeof error,
          caughtIsArray: Array.isArray(error),
          messageType: typeof error?.message,
          messageIsArray: Array.isArray(error?.message),
          returnErrorType: typeof failResult.error,
          returnErrorIsArray: Array.isArray(failResult.error),
          returnErrorPreview:
            typeof failResult.error === "string"
              ? failResult.error.slice(0, 80)
              : String(failResult.error).slice(0, 80),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return failResult;
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
