"use client";

import { useEffect, useRef } from "react";

export function OneSignalInit({ playerId }) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const initializedForPlayer = useRef(null);

  useEffect(() => {
    if (!appId || !playerId || typeof window === "undefined") {
      return;
    }

    if (initializedForPlayer.current === playerId) {
      return;
    }

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      await OneSignal.init({
        appId,
        allowLocalhostAsSecureOrigin: process.env.NODE_ENV === "development",
        notifyButton: {
          enable: false,
        },
      });

      await OneSignal.login(playerId);
      initializedForPlayer.current = playerId;
    });

    if (!document.getElementById("onesignal-sdk")) {
      const script = document.createElement("script");
      script.id = "onesignal-sdk";
      script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      script.defer = true;
      document.head.appendChild(script);
    }
  }, [appId, playerId]);

  return null;
}
