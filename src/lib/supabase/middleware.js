import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

function hasSupabaseAuthCookie(request) {
  return request.cookies.getAll().some(
    (cookie) => cookie.name.startsWith("sb-") && cookie.value
  );
}

function clearSupabaseAuthCookies(request, response) {
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.set(cookie.name, "", { maxAge: 0, path: "/" });
    }
  }
}

export async function updateSession(request) {
  if (!hasSupabaseAuthCookie(request)) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL.trim(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.getUser();

  if (error) {
    await supabase.auth.signOut().catch(() => {});
    clearSupabaseAuthCookies(request, supabaseResponse);
  }

  return supabaseResponse;
}
