import { NextResponse } from "next/server";

import {
  AVAILABILITY_REMINDER_MESSAGE,
  buildResponsesMap,
  getIncompleteSquadPlayerIds,
  getUpcomingWeekStart,
  getWeekStartKey,
} from "@/lib/availability-reminder";
import { isAvailabilityReminderWindow } from "@/lib/brussels-time";
import { rowToPlayer } from "@/lib/players-db";
import { sendPushToExternalIds } from "@/lib/onesignal";
import { syncRbfaCalendar } from "@/lib/rbfa-sync";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "1";
  const skipRbfa = searchParams.get("skipRbfa") === "1";

  let rbfaSync = null;

  if (!skipRbfa) {
    try {
      rbfaSync = await syncRbfaCalendar();
    } catch (error) {
      console.error("[availability-reminder] RBFA sync failed:", error);
      rbfaSync = {
        success: false,
        error: error?.message ?? "RBFA sync mislukt.",
      };
    }
  }

  if (!force && !isAvailabilityReminderWindow()) {
    return NextResponse.json({
      skipped: true,
      reason: "Buiten het venster zondag 20:00 (Europe/Brussels).",
      rbfaSync,
    });
  }

  const weekStart = getUpcomingWeekStart(new Date());
  const weekStartKey = getWeekStartKey(weekStart);

  try {
    const supabase = createAdminClient();

    const { data: existingLog, error: logError } = await supabase
      .from("availability_reminder_log")
      .select("week_start")
      .eq("week_start", weekStartKey)
      .maybeSingle();

    if (logError) {
      throw logError;
    }

    if (existingLog && !force) {
      return NextResponse.json({
        skipped: true,
        reason: "Herinnering voor deze week is al verstuurd.",
        weekStart: weekStartKey,
        rbfaSync,
      });
    }

    const [
      { data: playerRows, error: playersError },
      { data: eventRows, error: eventsError },
      { data: availabilityRows, error: availabilityError },
      { data: pushRows, error: pushError },
    ] = await Promise.all([
      supabase
        .from("players")
        .select("id, name, is_admin, is_squad_player, auth_user_id")
        .not("auth_user_id", "is", null),
      supabase.from("events").select("id, type, date, time, location, is_home, opponent"),
      supabase.from("availability").select("player_id, event_id, status"),
      supabase.from("push_preferences").select("player_id, enabled").eq("enabled", true),
    ]);

    if (playersError) {
      throw playersError;
    }

    if (eventsError) {
      throw eventsError;
    }

    if (availabilityError) {
      throw availabilityError;
    }

    if (pushError) {
      throw pushError;
    }

    const players = (playerRows ?? []).map((row) => ({
      ...rowToPlayer(row),
      authUserId: row.auth_user_id,
    }));
    const events = eventRows ?? [];
    const responses = buildResponsesMap(availabilityRows ?? []);
    const pushEnabledPlayerIds = (pushRows ?? []).map((row) => row.player_id);

    const recipientIds = getIncompleteSquadPlayerIds({
      players,
      events,
      responses,
      weekStart,
      pushEnabledPlayerIds,
    });

    if (recipientIds.length === 0) {
      if (!existingLog) {
        await supabase.from("availability_reminder_log").upsert(
          {
            week_start: weekStartKey,
            sent_at: new Date().toISOString(),
            recipient_count: 0,
          },
          { onConflict: "week_start" }
        );
      }

      return NextResponse.json({
        success: true,
        weekStart: weekStartKey,
        recipientCount: 0,
        message: "Geen spelers met openstaande beschikbaarheid en actieve push.",
        rbfaSync,
      });
    }

    const pushResult = await sendPushToExternalIds({
      externalIds: recipientIds,
      heading: "Squad Planner",
      message: AVAILABILITY_REMINDER_MESSAGE,
      url: process.env.NEXT_PUBLIC_SITE_URL,
    });

    await supabase.from("availability_reminder_log").upsert(
      {
        week_start: weekStartKey,
        sent_at: new Date().toISOString(),
        recipient_count: recipientIds.length,
      },
      { onConflict: "week_start" }
    );

    return NextResponse.json({
      success: true,
      weekStart: weekStartKey,
      recipientCount: recipientIds.length,
      oneSignalNotificationId: pushResult.id,
      recipients: pushResult.recipients,
      rbfaSync,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message ?? "Kon beschikbaarheidsherinnering niet versturen.",
        rbfaSync,
      },
      { status: 500 }
    );
  }
}
