import { NextResponse } from "next/server";

import { syncRbfaCalendar } from "@/lib/rbfa-sync";

function isAuthorized(request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncRbfaCalendar();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[rbfa-calendar]", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message ?? "Kon RBFA-kalender niet synchroniseren.",
      },
      { status: 500 }
    );
  }
}
