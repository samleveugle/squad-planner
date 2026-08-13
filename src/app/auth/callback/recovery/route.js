import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

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
      hypothesisId: "H4",
      location: "recovery/route.js:GET",
      message: "recovery callback hit",
      data: {
        hasCode: Boolean(code),
        paramKeys: [...searchParams.keys()],
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (!code) {
    return NextResponse.redirect(`${origin}/forgot-password?error=auth`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/forgot-password?error=auth`);
  }

  return NextResponse.redirect(`${origin}/auth/reset-password`);
}
