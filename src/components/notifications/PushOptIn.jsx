"use client";

import { useCallback, useEffect, useState } from "react";

import { getPushPreference, setPushEnabled } from "@/app/actions/push";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";

async function getOneSignal() {
  if (typeof window === "undefined" || !window.OneSignalDeferred) {
    return null;
  }

  return new Promise((resolve) => {
    window.OneSignalDeferred.push(async (OneSignal) => {
      resolve(OneSignal);
    });
  });
}

export function PushOptIn({ currentPlayer }) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const loadPreference = useCallback(async () => {
    setLoading(true);
    const result = await getPushPreference();
    setEnabled(result.success ? result.enabled : false);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!appId || !currentPlayer.isSquadPlayer) {
      setLoading(false);
      return;
    }

    loadPreference();
  }, [appId, currentPlayer.id, currentPlayer.isSquadPlayer, loadPreference]);

  if (!appId || !currentPlayer.isSquadPlayer) {
    return null;
  }

  async function handleEnable() {
    setBusy(true);
    setMessage("");

    try {
      const OneSignal = await getOneSignal();

      if (!OneSignal) {
        setMessage("Pushdienst laadt nog. Probeer het zo dadelijk opnieuw.");
        return;
      }

      await OneSignal.login(currentPlayer.id);
      await OneSignal.Notifications.requestPermission();

      const permission = OneSignal.Notifications.permission;
      const optedIn = OneSignal.User?.PushSubscription?.optedIn;

      if (!permission && !optedIn) {
        setMessage("Meldingen werden geweigerd. Zet ze aan in je browser of telefooninstellingen.");
        return;
      }

      const result = await setPushEnabled(true);

      if (!result.success) {
        setMessage(result.error);
        return;
      }

      setEnabled(true);
      setMessage("Meldingen staan aan. Je krijgt enkel een herinnering als je beschikbaarheid nog ontbreekt.");
    } catch (error) {
      setMessage(error?.message ?? "Kon meldingen niet inschakelen.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setBusy(true);
    setMessage("");

    try {
      const OneSignal = await getOneSignal();

      if (OneSignal?.User?.PushSubscription?.optOut) {
        await OneSignal.User.PushSubscription.optOut();
      }

      const result = await setPushEnabled(false);

      if (!result.success) {
        setMessage(result.error);
        return;
      }

      setEnabled(false);
      setMessage("Meldingen staan uit.");
    } catch (error) {
      setMessage(error?.message ?? "Kon meldingen niet uitschakelen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium">Beschikbaarheidsherinnering</p>
          <p className="text-xs text-muted-foreground">
            Zondag om 20:00, enkel als je nog niet alles hebt ingevuld voor komende week.
          </p>
        </div>

        {loading ? (
          <p className="text-xs text-muted-foreground">Laden...</p>
        ) : enabled ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDisable}
            disabled={busy}
          >
            <BellOff />
            Meldingen uit
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={handleEnable} disabled={busy}>
            <Bell />
            Meldingen aan
          </Button>
        )}
      </div>

      {message && <p className="mt-2 text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
