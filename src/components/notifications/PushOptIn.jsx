"use client";

import { useCallback, useEffect, useState } from "react";

import { getPushPreference, setPushEnabled } from "@/app/actions/push";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  disablePushSubscription,
  enablePushForPlayer,
  getIosPwaRequirementMessage,
  getOneSignalInstance,
  initializeOneSignal,
  isOneSignalSupportedHost,
  waitForOneSignal,
} from "@/lib/onesignal-client";
import { Bell, BellOff, Loader2 } from "lucide-react";

export function PushOptIn({ currentPlayer }) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const [supportedHost, setSupportedHost] = useState(false);
  const [sdkStatus, setSdkStatus] = useState("loading");
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
      setSdkStatus("idle");
      return;
    }

    loadPreference();

    const iosRequirement = getIosPwaRequirementMessage();

    if (iosRequirement) {
      setSdkStatus("unsupported");
      setMessage(iosRequirement);
      setMessageTone("error");
      return;
    }

    if (getOneSignalInstance()) {
      setSdkStatus("ready");
      return;
    }

    function handleReady() {
      setSdkStatus("ready");
      setMessage("");
      setMessageTone("muted");
    }

    function handleError(event) {
      setSdkStatus("error");
      setMessage(event.detail?.message ?? "Pushdienst kon niet starten.");
      setMessageTone("error");
    }

    window.addEventListener("onesignal-ready", handleReady);
    window.addEventListener("onesignal-error", handleError);

    const timeout = window.setTimeout(() => {
      if (!getOneSignalInstance()) {
        setSdkStatus("error");
        setMessage(
          "Pushdienst startte niet. Sluit de app, open opnieuw vanaf je beginscherm en probeer opnieuw."
        );
        setMessageTone("error");
      }
    }, 22000);

    return () => {
      window.removeEventListener("onesignal-ready", handleReady);
      window.removeEventListener("onesignal-error", handleError);
      window.clearTimeout(timeout);
    };
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
      let OneSignal = getOneSignalInstance();

      if (!OneSignal) {
        OneSignal = await initializeOneSignal(appId, currentPlayer.id);
        setSdkStatus("ready");
      }

      await enablePushForPlayer(OneSignal, currentPlayer.id);

      const result = await setPushEnabled(true);

      if (!result.success) {
        throw new Error(result.error ?? "Kon voorkeur niet opslaan in database.");
      }

      setEnabled(true);
      setSdkStatus("ready");
      setMessageTone("success");
      setMessage("Meldingen staan aan. Je krijgt enkel een herinnering als je beschikbaarheid nog ontbreekt.");
    } catch (error) {
      setEnabled(false);
      setSdkStatus("error");
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
      await disablePushSubscription(OneSignal);

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
  const canClickEnable =
    !busy && (sdkStatus === "ready" || sdkStatus === "error");
  const enableLabel = busy
    ? "Bezig..."
    : sdkStatus === "loading"
      ? "Push laden..."
      : sdkStatus === "error"
        ? "Opnieuw proberen"
        : "Meldingen aan";

  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">Beschikbaarheidsherinnering</p>
            {!loading && <Badge variant={statusVariant}>{statusLabel}</Badge>}
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
          <Button type="button" size="sm" onClick={handleEnable} disabled={!canClickEnable}>
            {busy || sdkStatus === "loading" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Bell />
            )}
            {enableLabel}
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
