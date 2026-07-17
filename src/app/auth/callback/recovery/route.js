import { NextResponse } from "next/server";

import { debugLog } from "@/lib/debug-log";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // #region agent log
  debugLog(
    "auth/callback/recovery/route.js",
    "recovery callback hit",
    { hasCode: Boolean(code), paramKeys: [...searchParams.keys()] },
    "A"
  );
  // #endregion

  if (!code) {
    return NextResponse.redirect(`${origin}/forgot-password?error=auth`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // #region agent log
    debugLog(
      "auth/callback/recovery/route.js",
      "exchange failed",
      { errorMessage: error.message },
      "C"
    );
    // #endregion
    return NextResponse.redirect(`${origin}/forgot-password?error=auth`);
  }

  return NextResponse.redirect(`${origin}/auth/reset-password`);
}
