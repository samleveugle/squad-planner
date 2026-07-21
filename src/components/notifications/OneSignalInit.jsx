"use client";

import { useEffect, useRef } from "react";

import {
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
      return;
    }

    startedForPlayer.current = playerId;

    initializeOneSignal(appId, playerId)
      .then(() => {
        window.dispatchEvent(new CustomEvent("onesignal-ready"));
      })
      .catch((error) => {
        startedForPlayer.current = null;
        window.dispatchEvent(
          new CustomEvent("onesignal-error", {
            detail: { message: error?.message ?? "OneSignal init mislukt" },
          })
        );
      });
  }, [appId, playerId]);

  return null;
}
