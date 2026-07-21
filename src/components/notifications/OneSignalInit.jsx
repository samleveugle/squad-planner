"use client";

import { useEffect, useRef } from "react";

import {
  agentDebugLog,
  getOneSignalInstance,
  initializeOneSignal,
  isOneSignalSupportedHost,
} from "@/lib/onesignal-client";

export function OneSignalInit({ playerId }) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const bootingRef = useRef(false);

  useEffect(() => {
    if (!appId || !playerId || typeof window === "undefined") {
      return;
    }

    if (!isOneSignalSupportedHost()) {
      return;
    }

    let cancelled = false;

    async function boot(reason) {
      if (cancelled) {
        return;
      }

      if (getOneSignalInstance()) {
        window.dispatchEvent(new CustomEvent("onesignal-ready"));
        return;
      }

      if (bootingRef.current) {
        return;
      }

      bootingRef.current = true;

      // #region agent log
      agentDebugLog("D", "OneSignalInit.jsx:start", "OneSignalInit starting initializeOneSignal", {
        playerId,
        reason,
      });
      // #endregion

      try {
        await initializeOneSignal(appId, playerId);
        if (cancelled) {
          return;
        }
        // #region agent log
        agentDebugLog("C", "OneSignalInit.jsx:ready", "dispatching onesignal-ready", {
          playerId,
          reason,
        });
        // #endregion
        window.dispatchEvent(new CustomEvent("onesignal-ready"));
      } catch (error) {
        if (cancelled) {
          return;
        }
        // #region agent log
        agentDebugLog("B", "OneSignalInit.jsx:error", "dispatching onesignal-error", {
          playerId,
          reason,
          error: error?.message ?? String(error),
        });
        // #endregion
        window.dispatchEvent(
          new CustomEvent("onesignal-error", {
            detail: { message: error?.message ?? "OneSignal init mislukt" },
          })
        );
      } finally {
        bootingRef.current = false;
      }
    }

    function handleResume() {
      if (document.visibilityState === "visible" && !getOneSignalInstance()) {
        boot("resume");
      }
    }

    function handleOnline() {
      if (!getOneSignalInstance()) {
        boot("online");
      }
    }

    boot("mount");

    window.addEventListener("pageshow", handleResume);
    document.addEventListener("visibilitychange", handleResume);
    window.addEventListener("online", handleOnline);

    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", handleResume);
      document.removeEventListener("visibilitychange", handleResume);
      window.removeEventListener("online", handleOnline);
    };
  }, [appId, playerId]);

  return null;
}
