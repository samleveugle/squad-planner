"use client";

import { useCallback, useEffect, useState } from "react";

import { getPushPreference, setPushEnabled } from "@/app/actions/push";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  agentDebugLog,
  disablePushSubscription,
  enablePushForPlayer,
  getAgentDebugLogs,
  getIosPwaRequirementMessage,
  getOneSignalInstance,
  initializeOneSignal,
  isOneSignalSupportedHost,
  waitForOneSignal,
  withNetworkRetry,
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

    try {
      const result = await withNetworkRetry(() => getPushPreference(), {
        attempts: 4,
        label: "getPushPreference",
      });

      if (!result.success && result.error) {
        setEnabled(false);
        setMessage(result.error);
        setMessageTone("error");
        setLoading(false);
        return;
      }

      setEnabled(result.enabled ?? false);
      setLoading(false);
    } catch (error) {
      setEnabled(false);
      setMessage(error?.message ?? "Kon meldingsvoorkeur niet laden.");
      setMessageTone("error");
      setLoading(false);
    }
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

    let cancelled = false;

    loadPreference();

    const iosRequirement = getIosPwaRequirementMessage();

    if (iosRequirement) {
      setSdkStatus("unsupported");
      setMessage(iosRequirement);
      setMessageTone("error");
      return;
    }

    // #region agent log
    agentDebugLog("C", "PushOptIn.jsx:effect", "PushOptIn sdk effect run", {
      hasInstance: !!getOneSignalInstance(),
      visibility: document.visibilityState,
      online: navigator.onLine,
    });
    // #endregion

    function markReady() {
      if (cancelled) {
        return;
      }
      setSdkStatus("ready");
      setMessage((current) =>
        current.startsWith("Pushdienst") || current.includes("NetworkError") ? "" : current
      );
      setMessageTone("muted");
    }

    function markError(errorMessage) {
      if (cancelled) {
        return;
      }
      setSdkStatus("error");
      setMessage(errorMessage ?? "Pushdienst kon niet starten.");
      setMessageTone("error");
    }

    async function ensureSdk(reason) {
      if (getOneSignalInstance()) {
        markReady();
        return;
      }

      setSdkStatus((current) => (current === "ready" ? current : "loading"));

      // #region agent log
      agentDebugLog("C", "PushOptIn.jsx:ensureSdk", "ensuring sdk", { reason });
      // #endregion

      try {
        await initializeOneSignal(appId, currentPlayer.id);
        markReady();
        window.dispatchEvent(new CustomEvent("onesignal-ready"));
      } catch (error) {
        // #region agent log
        agentDebugLog("C", "PushOptIn.jsx:ensureSdkError", "ensure sdk failed", {
          reason,
          error: error?.message ?? String(error),
        });
        // #endregion
        markError(error?.message ?? "Pushdienst kon niet starten.");
      }
    }

    function handleReady() {
      // #region agent log
      agentDebugLog("C", "PushOptIn.jsx:handleReady", "received onesignal-ready", {
        hasInstance: !!getOneSignalInstance(),
      });
      // #endregion
      markReady();
    }

    function handleError(event) {
      // #region agent log
      agentDebugLog("C", "PushOptIn.jsx:handleError", "received onesignal-error", {
        error: event.detail?.message ?? null,
      });
      // #endregion
      if (!getOneSignalInstance()) {
        markError(event.detail?.message ?? "Pushdienst kon niet starten.");
      }
    }

    function handleResume(event) {
      // #region agent log
      agentDebugLog("E", "PushOptIn.jsx:resume", "resume event", {
        type: event?.type,
        persisted: !!event?.persisted,
        hasInstance: !!getOneSignalInstance(),
        visibility: document.visibilityState,
        online: navigator.onLine,
      });
      // #endregion

      if (document.visibilityState && document.visibilityState !== "visible") {
        return;
      }

      loadPreference();

      if (!getOneSignalInstance()) {
        ensureSdk(event?.type ?? "resume");
      } else {
        markReady();
      }
    }

    window.addEventListener("onesignal-ready", handleReady);
    window.addEventListener("onesignal-error", handleError);
    window.addEventListener("pageshow", handleResume);
    window.addEventListener("online", handleResume);
    document.addEventListener("visibilitychange", handleResume);

    ensureSdk("mount");

    const timeout = window.setTimeout(() => {
      if (!getOneSignalInstance() && !cancelled) {
        // #region agent log
        agentDebugLog("C", "PushOptIn.jsx:timeout", "22s sdk timeout — retrying once", {
          visibility: document.visibilityState,
          online: navigator.onLine,
        });
        // #endregion
        ensureSdk("timeout-retry");
      }
    }, 22000);

    return () => {
      cancelled = true;
      window.removeEventListener("onesignal-ready", handleReady);
      window.removeEventListener("onesignal-error", handleError);
      window.removeEventListener("pageshow", handleResume);
      window.removeEventListener("online", handleResume);
      document.removeEventListener("visibilitychange", handleResume);
      window.clearTimeout(timeout);
    };
  }, [appId, currentPlayer.id, currentPlayer.isSquadPlayer, loadPreference, supportedHost]);

  if (!appId || !currentPlayer.isSquadPlayer) {
    return null;
  }

  if (!supportedHost) {
    return (
      <div className="rounded-lg border border-dashed bg-card px-4 py-3">
        <p className="text-sm font-medium">Herinnering</p>
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
      const OneSignal = await initializeOneSignal(appId, currentPlayer.id);
      setSdkStatus("ready");

      await enablePushForPlayer(OneSignal, currentPlayer.id);

      const result = await withNetworkRetry(() => setPushEnabled(true), {
        attempts: 4,
        label: "setPushEnabled",
      });

      if (!result.success) {
        throw new Error(result.error ?? "Kon voorkeur niet opslaan in database.");
      }

      setEnabled(true);
      setSdkStatus("ready");
      setMessageTone("success");
      setMessage(
        "Meldingen staan aan. Je krijgt enkel een herinnering als je beschikbaarheid nog ontbreekt."
      );
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

      const result = await withNetworkRetry(() => setPushEnabled(false), {
        attempts: 4,
        label: "setPushEnabled",
      });

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
  const canClickEnable = !busy && (sdkStatus === "ready" || sdkStatus === "error");
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
            <p className="text-sm font-medium">Herinnering</p>
            {!loading && <Badge variant={statusVariant}>{statusLabel}</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">Elke zondag om 20:00.</p>
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
            {busy || sdkStatus === "loading" ? <Loader2 className="animate-spin" /> : <Bell />}
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

      {/* #region agent log */}
      {messageTone === "error" && (
        <button
          type="button"
          className="mt-2 text-xs underline text-muted-foreground"
          onClick={async () => {
            const logs = getAgentDebugLogs();
            const text = JSON.stringify(logs, null, 2);
            try {
              await navigator.clipboard.writeText(text);
              setMessage(`${message}\n\n[Debuglog gekopieerd — plak in chat]`);
            } catch {
              setMessage(`${message}\n\n[Debuglog:]\n${text.slice(0, 1500)}`);
            }
          }}
        >
          Kopieer debuglog
        </button>
      )}
      {/* #endregion */}
    </div>
  );
}
