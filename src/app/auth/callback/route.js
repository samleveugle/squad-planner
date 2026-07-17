import { NextResponse } from "next/server";

import { linkPlayerToAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const type = searchParams.get("type");

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=auth`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/?error=auth`);
  }

  const safeNext = next.startsWith("/") ? next : "/";
  const isRecovery = type === "recovery" || safeNext === "/auth/reset-password";

  if (isRecovery) {
    return NextResponse.redirect(`${origin}/auth/reset-password`);
  }

  await linkPlayerToAuthUser(data.user);
  return NextResponse.redirect(`${origin}${safeNext}`);
}
