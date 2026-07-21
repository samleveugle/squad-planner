"use client";

import { useEffect, useRef } from "react";

import {
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

    async function boot() {
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

      try {
        await initializeOneSignal(appId, playerId);
        if (cancelled) {
          return;
        }
        window.dispatchEvent(new CustomEvent("onesignal-ready"));
      } catch (error) {
        if (cancelled) {
          return;
        }
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
        boot();
      }
    }

    function handleOnline() {
      if (!getOneSignalInstance()) {
        boot();
      }
    }

    boot();

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
