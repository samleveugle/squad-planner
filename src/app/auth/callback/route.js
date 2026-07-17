import { NextResponse } from "next/server";

import { linkPlayerToAuthUser } from "@/lib/auth";
import { debugLog } from "@/lib/debug-log";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const type = searchParams.get("type");

  // #region agent log
  debugLog(
    "auth/callback/route.js",
    "callback hit",
    {
      paramKeys: [...searchParams.keys()],
      hasCode: Boolean(code),
      next,
      type,
      pathname: new URL(request.url).pathname,
    },
    "A"
  );
  // #endregion

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=auth`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    // #region agent log
    debugLog(
      "auth/callback/route.js",
      "exchange failed",
      { errorMessage: error?.message ?? null },
      "C"
    );
    // #endregion
    return NextResponse.redirect(`${origin}/?error=auth`);
  }

  const safeNext = next.startsWith("/") ? next : "/";
  const isRecovery = type === "recovery" || safeNext === "/auth/reset-password";

  // #region agent log
  debugLog(
    "auth/callback/route.js",
    "redirect decision",
    { safeNext, isRecovery, willLinkPlayer: !isRecovery },
    "A"
  );
  // #endregion

  if (isRecovery) {
    return NextResponse.redirect(`${origin}/auth/reset-password`);
  }

  await linkPlayerToAuthUser(data.user);
  return NextResponse.redirect(`${origin}${safeNext}`);
}
