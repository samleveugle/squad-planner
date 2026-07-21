"use client";

import { useEffect, useRef } from "react";

import {
  isOneSignalSupportedHost,
  loadOneSignalScript,
} from "@/lib/onesignal-client";

export function OneSignalInit({ playerId }) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const initializedForPlayer = useRef(null);

  useEffect(() => {
    if (!appId || !playerId || typeof window === "undefined") {
      return;
    }

    if (!isOneSignalSupportedHost()) {
      return;
    }

    if (initializedForPlayer.current === playerId) {
      return;
    }

    loadOneSignalScript();

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        await OneSignal.init({
          appId,
          notifyButton: {
            enable: false,
          },
        });

        await OneSignal.login(playerId);
        initializedForPlayer.current = playerId;
        window.dispatchEvent(new CustomEvent("onesignal-ready"));
      } catch (error) {
        window.dispatchEvent(
          new CustomEvent("onesignal-error", {
            detail: { message: error?.message ?? "OneSignal init mislukt" },
          })
        );
      }
    });
  }, [appId, playerId]);

  return null;
}
