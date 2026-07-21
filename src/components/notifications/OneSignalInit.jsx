"use client";

import { useEffect, useRef } from "react";

import {
  agentDebugLog,
  initializeOneSignal,
  isOneSignalSupportedHost,
} from "@/lib/onesignal-client";

export function OneSignalInit({ playerId }) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const startedForPlayer = useRef(null);

  useEffect(() => {
    if (!appId || !playerId || typeof window === "undefined") {
      return;
    }

    if (!isOneSignalSupportedHost()) {
      return;
    }

    if (startedForPlayer.current === playerId) {
      // #region agent log
      agentDebugLog("D", "OneSignalInit.jsx:skip", "skipped init: startedForPlayer already set", {
        playerId,
        startedForPlayer: startedForPlayer.current,
      });
      // #endregion
      return;
    }

    startedForPlayer.current = playerId;

    // #region agent log
    agentDebugLog("D", "OneSignalInit.jsx:start", "OneSignalInit starting initializeOneSignal", {
      playerId,
    });
    // #endregion

    initializeOneSignal(appId, playerId)
      .then(() => {
        // #region agent log
        agentDebugLog("C", "OneSignalInit.jsx:ready", "dispatching onesignal-ready", { playerId });
        // #endregion
        window.dispatchEvent(new CustomEvent("onesignal-ready"));
      })
      .catch((error) => {
        startedForPlayer.current = null;
        // #region agent log
        agentDebugLog("B", "OneSignalInit.jsx:error", "dispatching onesignal-error", {
          playerId,
          error: error?.message ?? String(error),
        });
        // #endregion
        window.dispatchEvent(
          new CustomEvent("onesignal-error", {
            detail: { message: error?.message ?? "OneSignal init mislukt" },
          })
        );
      });
  }, [appId, playerId]);

  return null;
}
