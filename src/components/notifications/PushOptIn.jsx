"use client";

import { useCallback, useEffect, useState } from "react";

import { getPushPreference, setPushEnabled } from "@/app/actions/push";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  disablePushSubscription,
  enablePushForPlayer,
  isOneSignalSupportedHost,
  loadOneSignalScript,
  waitForOneSignal,
} from "@/lib/onesignal-client";
import { Bell, BellOff, Loader2 } from "lucide-react";

export function PushOptIn({ currentPlayer }) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const [supportedHost, setSupportedHost] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("muted");

  const loadPreference = useCallback(async () => {
    setLoading(true);
    const result = await getPushPreference();

    if (!result.success && result.error) {
      setEnabled(false);
      setMessage(result.error);
      setMessageTone("error");
      setLoading(false);
      return;
    }

    setEnabled(result.enabled ?? false);
    setLoading(false);
  }, []);

  useEffect(() => {
    setSupportedHost(isOneSignalSupportedHost());
  }, []);

  useEffect(() => {
    if (!appId || !currentPlayer.isSquadPlayer || !supportedHost) {
      setLoading(false);
      return;
    }

    loadPreference();
    loadOneSignalScript();

    function handleReady() {
      setSdkReady(true);
    }

    window.addEventListener("onesignal-ready", handleReady);

    waitForOneSignal(15000)
      .then(() => setSdkReady(true))
      .catch(() => {
        setSdkReady(false);
      });

    return () => window.removeEventListener("onesignal-ready", handleReady);
  }, [appId, currentPlayer.id, currentPlayer.isSquadPlayer, loadPreference, supportedHost]);

  if (!appId || !currentPlayer.isSquadPlayer) {
    return null;
  }

  if (!supportedHost) {
    return (
      <div className="rounded-lg border border-dashed bg-card px-4 py-3">
        <p className="text-sm font-medium">Beschikbaarheidsherinnering</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Pushmeldingen werken enkel op de live app. Open de app via je Vercel-URL om
          meldingen in te schakelen.
        </p>
      </div>
    );
  }

  async function handleEnable() {
    setBusy(true);
    setMessage("");
    setMessageTone("muted");

    try {
      const OneSignal = await waitForOneSignal();

      if (!OneSignal) {
        throw new Error("Pushdienst is niet beschikbaar. Vernieuw de pagina.");
      }

      await enablePushForPlayer(OneSignal, currentPlayer.id);

      const result = await setPushEnabled(true);

      if (!result.success) {
        throw new Error(result.error ?? "Kon voorkeur niet opslaan in database.");
      }

      setEnabled(true);
      setMessageTone("success");
      setMessage("Meldingen staan aan. Je krijgt enkel een herinnering als je beschikbaarheid nog ontbreekt.");
    } catch (error) {
      setEnabled(false);
      setMessageTone("error");
      setMessage(error?.message ?? "Kon meldingen niet inschakelen.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setBusy(true);
    setMessage("");
    setMessageTone("muted");

    try {
      const OneSignal = await waitForOneSignal();

      if (OneSignal) {
        await disablePushSubscription(OneSignal);
      }

      const result = await setPushEnabled(false);

      if (!result.success) {
        throw new Error(result.error ?? "Kon voorkeur niet opslaan.");
      }

      setEnabled(false);
      setMessageTone("success");
      setMessage("Meldingen staan uit.");
    } catch (error) {
      setMessageTone("error");
      setMessage(error?.message ?? "Kon meldingen niet uitschakelen.");
    } finally {
      setBusy(false);
    }
  }

  const statusLabel = loading ? "Laden..." : enabled ? "Aan" : "Uit";
  const statusVariant = enabled ? "present" : "outline";

  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">Beschikbaarheidsherinnering</p>
            {!loading && (
              <Badge variant={statusVariant}>{statusLabel}</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Zondag om 20:00, enkel als je nog niet alles hebt ingevuld voor komende week.
          </p>
        </div>

        {loading ? (
          <p className="text-xs text-muted-foreground">Voorkeur laden...</p>
        ) : enabled ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDisable}
            disabled={busy}
          >
            {busy ? <Loader2 className="animate-spin" /> : <BellOff />}
            {busy ? "Bezig..." : "Meldingen uit"}
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={handleEnable}
            disabled={busy || !sdkReady}
          >
            {busy ? <Loader2 className="animate-spin" /> : <Bell />}
            {busy ? "Bezig..." : sdkReady ? "Meldingen aan" : "Laden..."}
          </Button>
        )}
      </div>

      {message && (
        <p
          className={`mt-2 text-xs ${
            messageTone === "error"
              ? "text-red-600 dark:text-red-400"
              : messageTone === "success"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
