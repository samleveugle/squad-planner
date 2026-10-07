import { NextResponse } from "next/server";

import {
  AVAILABILITY_REMINDER_MESSAGE,
  getAvailabilityReminderRecipientIds,
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

async function runAvailabilityReminder({ force }) {
  const weekStart = getUpcomingWeekStart(new Date());
  const weekStartKey = getWeekStartKey(weekStart);

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
    return {
      skipped: true,
      reason: "Herinnering voor deze week is al verstuurd.",
      weekStart: weekStartKey,
    };
  }

  const [
    { data: playerRows, error: playersError },
    { data: eventRows, error: eventsError },
    { data: pushRows, error: pushError },
  ] = await Promise.all([
    supabase
      .from("players")
      .select("id, name, is_admin, is_squad_player, auth_user_id")
      .not("auth_user_id", "is", null),
    supabase.from("events").select("id, type, date, time, location, is_home, opponent"),
    supabase.from("push_preferences").select("player_id, enabled").eq("enabled", true),
  ]);

  if (playersError) {
    throw playersError;
  }

  if (eventsError) {
    throw eventsError;
  }

  if (pushError) {
    throw pushError;
  }

  const players = (playerRows ?? []).map((row) => ({
    ...rowToPlayer(row),
    authUserId: row.auth_user_id,
  }));
  const events = eventRows ?? [];
  const pushEnabledPlayerIds = (pushRows ?? []).map((row) => row.player_id);

  const recipientIds = getAvailabilityReminderRecipientIds({
    players,
    events,
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

    return {
      success: true,
      weekStart: weekStartKey,
      recipientCount: 0,
      message: "Geen spelers met actieve push of geen events in komende week.",
    };
  }

  const pushResult = await sendPushToExternalIds({
    externalIds: recipientIds,
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

  return {
    success: true,
    weekStart: weekStartKey,
    recipientCount: recipientIds.length,
    oneSignalNotificationId: pushResult.id,
    recipients: pushResult.recipients,
  };
}

async function syncRbfaCalendarSafe() {
  try {
    return await syncRbfaCalendar();
  } catch (error) {
    console.error("[availability-reminder] RBFA sync failed:", error);
    return {
      success: false,
      error: error?.message ?? "RBFA sync mislukt.",
    };
  }
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "1";
  const skipRbfa = searchParams.get("skipRbfa") === "1";
  const shouldSendReminder = force || isAvailabilityReminderWindow();

  let reminder = {
    skipped: true,
    reason: "Buiten het venster maandag 20:00 (Europe/Brussels).",
  };
  let reminderStatus = 200;

  if (shouldSendReminder) {
    try {
      reminder = await runAvailabilityReminder({ force });
    } catch (error) {
      reminderStatus = 500;
      reminder = {
        success: false,
        error: error?.message ?? "Kon beschikbaarheidsherinnering niet versturen.",
      };
    }
  }

  const rbfaSync = skipRbfa ? null : await syncRbfaCalendarSafe();

  return NextResponse.json({ ...reminder, rbfaSync }, { status: reminderStatus });
}
