"use server";

import { redirect } from "next/navigation";

import { getPlayerByEmail, getSiteUrl } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function sendMagicLink(email) {
  const normalizedEmail = email?.trim().toLowerCase();

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

    return {
      success: true,
      message: `Loginlink verstuurd naar ${normalizedEmail}. Check ook je spam.`,
    };
  } catch (error) {
    return {
      success: false,
      error: error?.message ?? "Kon loginlink niet versturen.",
    };
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
