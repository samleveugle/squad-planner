export function getSiteHostname() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    return null;
  }

  try {
    return new URL(siteUrl).hostname;
  } catch {
    return null;
  }
}

export function isOneSignalSupportedHost(hostname = null) {
  if (typeof window === "undefined" && !hostname) {
    return false;
  }

  const currentHost = hostname ?? window.location.hostname;

  if (currentHost === "localhost" || currentHost === "127.0.0.1") {
    return process.env.NEXT_PUBLIC_ONESIGNAL_ALLOW_LOCALHOST === "true";
  }

  const siteHostname = getSiteHostname();

  if (!siteHostname) {
    return false;
  }

  return currentHost === siteHostname;
}

export function getPushEnvironment() {
  if (typeof window === "undefined") {
    return {
      platform: "unknown",
      isIos: false,
      isAndroid: false,
      isStandalonePwa: false,
    };
  }

  const userAgent = window.navigator.userAgent;
  const isIos =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(userAgent);
  const isStandalonePwa =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  let platform = "desktop";

  if (isIos) {
    platform = "ios";
  } else if (isAndroid) {
    platform = "android";
  }

  return { platform, isIos, isAndroid, isStandalonePwa };
}

export function getIosPwaRequirementMessage() {
  const { isIos, isStandalonePwa } = getPushEnvironment();

  if (isIos && !isStandalonePwa) {
    return "Op iPhone werken pushmeldingen enkel als je Squad Planner toevoegt aan je beginscherm (Safari → Deel → Zet op beginscherm) en de app vandaar opent.";
  }

  return null;
}

function getUnsupportedPushMessage() {
  const iosMessage = getIosPwaRequirementMessage();

  if (iosMessage) {
    return iosMessage;
  }

  return "Pushmeldingen worden niet ondersteund in deze browser. Probeer Chrome op Android of de app via je iPhone-beginscherm.";
}

function ensureOneSignalDeferred() {
  if (typeof window === "undefined") {
    return null;
  }

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  return window.OneSignalDeferred;
}

function getPageState() {
  if (typeof window === "undefined") {
    return {
      instance: null,
      initPromise: null,
      initKey: null,
      initCompleted: false,
    };
  }

  if (!window.__squadOneSignalState) {
    window.__squadOneSignalState = {
      instance: null,
      initPromise: null,
      initKey: null,
      initCompleted: false,
    };
  }

  return window.__squadOneSignalState;
}

function isTransientNetworkError(error) {
  const message = `${error?.message ?? error ?? ""}`.toLowerCase();
  const name = `${error?.name ?? ""}`.toLowerCase();

  return (
    name === "networkerror" ||
    message.includes("networkerror") ||
    message.includes("load failed") ||
    message.includes("failed to fetch") ||
    message.includes("network request failed") ||
    message.includes("the internet connection appears to be offline")
  );
}

function isAlreadyInitializedError(error) {
  const message = `${error?.message ?? error ?? ""}`.toLowerCase();
  return message.includes("already initialized");
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function waitForOnline({ timeoutMs = 15000 } = {}) {
  if (typeof window === "undefined") {
    return;
  }

  if (window.navigator.onLine !== false) {
    return;
  }

  await new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener("online", onOnline);
      reject(new Error("Geen internetverbinding. Probeer opnieuw."));
    }, timeoutMs);

    function onOnline() {
      window.clearTimeout(timer);
      window.removeEventListener("online", onOnline);
      resolve();
    }

    window.addEventListener("online", onOnline);
  });
}

// #region agent log
function agentDebugLog(hypothesisId, location, message, data = {}) {
  if (typeof window === "undefined") {
    return;
  }
  const payload = {
    sessionId: "c0a40f",
    runId: "post-fix",
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  };
  try {
    const key = "debug-c0a40f";
    const prev = JSON.parse(window.localStorage.getItem(key) || "[]");
    prev.push(payload);
    window.localStorage.setItem(key, JSON.stringify(prev.slice(-80)));
  } catch {
    /* ignore */
  }
  // eslint-disable-next-line no-console
  console.info("[debug-c0a40f]", message, data);
  fetch("http://127.0.0.1:7891/ingest/2b6b089d-7eb8-434a-b07c-a2e87411d81f", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "c0a40f",
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

export function getAgentDebugLogs() {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    return JSON.parse(window.localStorage.getItem("debug-c0a40f") || "[]");
  } catch {
    return [];
  }
}

export function clearAgentDebugLogs() {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem("debug-c0a40f");
  } catch {
    /* ignore */
  }
}

export { agentDebugLog };
// #endregion

export function loadOneSignalScript() {
  if (typeof document === "undefined") {
    return Promise.resolve(false);
  }

  const existing = document.getElementById("onesignal-sdk");

  if (existing) {
    if (existing.dataset.failed === "true") {
      existing.remove();
    } else {
      // #region agent log
      agentDebugLog("A", "onesignal-client.js:loadOneSignalScript", "script tag already present", {
        hasWindowOneSignal: typeof window.OneSignal !== "undefined",
        deferredIsArray: Array.isArray(window.OneSignalDeferred),
        deferredLen: window.OneSignalDeferred?.length ?? null,
        pushIsNative:
          window.OneSignalDeferred?.push?.toString?.()?.includes?.("[native code]") ?? null,
      });
      // #endregion
      return Promise.resolve(true);
    }
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = "onesignal-sdk";
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js?v=160606";
    script.defer = true;
    script.onload = () => {
      // #region agent log
      agentDebugLog("A", "onesignal-client.js:loadOneSignalScript.onload", "script loaded fresh", {
        deferredLen: window.OneSignalDeferred?.length ?? null,
      });
      // #endregion
      resolve(true);
    };
    script.onerror = () => {
      script.dataset.failed = "true";
      reject(new TypeError("NetworkError: Load failed"));
    };
    document.head.appendChild(script);
  });
}

function acquireOneSignalSdk() {
  return new Promise((resolve, reject) => {
    const deferred = ensureOneSignalDeferred();

    if (!deferred) {
      reject(new Error("Pushdienst is niet beschikbaar."));
      return;
    }

    // #region agent log
    const pushStr = deferred.push?.toString?.() ?? "";
    agentDebugLog("A", "onesignal-client.js:deferred.push", "about to push deferred callback", {
      deferredLen: deferred.length,
      pushLooksNative: pushStr.includes("[native code]"),
      pushSnippet: pushStr.slice(0, 120),
      hasWindowOneSignal: typeof window.OneSignal !== "undefined",
      windowOneSignalType: typeof window.OneSignal,
    });
    // #endregion

    const timer = window.setTimeout(() => {
      // #region agent log
      agentDebugLog("A", "onesignal-client.js:deferred.timeout", "deferred callback timed out", {
        deferredLen: deferred.length,
        visibility: document.visibilityState,
      });
      // #endregion
      reject(
        new Error(
          "Pushdienst reageert niet. Sluit de app volledig, open opnieuw vanaf je beginscherm en probeer opnieuw."
        )
      );
    }, 20000);

    deferred.push((sdk) => {
      window.clearTimeout(timer);
      // #region agent log
      agentDebugLog("A", "onesignal-client.js:deferred.callback", "deferred callback fired", {
        hasSdk: !!sdk,
        hasNotifications: !!sdk?.Notifications,
        hasInit: typeof sdk?.init === "function",
      });
      // #endregion
      resolve(sdk);
    });
  });
}

async function initOneSignalSdk(OneSignal, appId) {
  const state = getPageState();

  if (state.initCompleted && state.instance) {
    return state.instance;
  }

  // #region agent log
  agentDebugLog("B", "onesignal-client.js:beforeInit", "calling OneSignal.init", {
    pushSupported:
      typeof OneSignal.Notifications?.isPushSupported === "function"
        ? OneSignal.Notifications.isPushSupported()
        : true,
    hasUser: !!OneSignal?.User,
    initCompleted: state.initCompleted,
  });
  // #endregion

  try {
    await OneSignal.init({
      appId,
      notifyButton: {
        enable: false,
      },
      serviceWorkerPath: "/OneSignalSDKWorker.js",
    });
    state.initCompleted = true;
  } catch (initError) {
    // #region agent log
    agentDebugLog("B", "onesignal-client.js:initError", "OneSignal.init threw", {
      error: initError?.message ?? String(initError),
    });
    // #endregion

    if (isAlreadyInitializedError(initError)) {
      state.initCompleted = true;
      return OneSignal;
    }

    throw initError;
  }

  return OneSignal;
}

async function runInitializeOneSignal(appId, playerId) {
  await waitForOnline();

  const pushSupportedCheckDelay = getPushEnvironment().isIos ? 250 : 0;
  if (pushSupportedCheckDelay) {
    await wait(pushSupportedCheckDelay);
  }

  await loadOneSignalScript();
  const OneSignal = await acquireOneSignalSdk();

  const pushSupported =
    typeof OneSignal.Notifications?.isPushSupported === "function"
      ? OneSignal.Notifications.isPushSupported()
      : true;

  if (!pushSupported) {
    throw new Error(getUnsupportedPushMessage());
  }

  await initOneSignalSdk(OneSignal, appId);
  await OneSignal.login(playerId);

  const state = getPageState();
  state.instance = OneSignal;
  state.initCompleted = true;

  // #region agent log
  agentDebugLog("B", "onesignal-client.js:initSuccess", "OneSignal init+login success", {
    initKey: `${appId}:${playerId}`,
  });
  // #endregion

  return OneSignal;
}

export function getOneSignalInstance() {
  return getPageState().instance;
}

export async function initializeOneSignal(appId, playerId) {
  const initKey = `${appId}:${playerId}`;
  const state = getPageState();

  // #region agent log
  agentDebugLog("B", "onesignal-client.js:initializeOneSignal:entry", "initializeOneSignal called", {
    initKey,
    hasInstance: !!state.instance,
    hasPromise: !!state.initPromise,
    currentInitKey: state.initKey,
    initCompleted: state.initCompleted,
    visibility: typeof document !== "undefined" ? document.visibilityState : null,
    online: typeof navigator !== "undefined" ? navigator.onLine : null,
    standalone:
      typeof window !== "undefined"
        ? !!(window.navigator.standalone || window.matchMedia("(display-mode: standalone)").matches)
        : null,
  });
  // #endregion

  if (state.instance) {
    if (state.initKey !== initKey) {
      await state.instance.login(playerId);
      state.initKey = initKey;
    }
    return state.instance;
  }

  if (state.initPromise) {
    const sdk = await state.initPromise;
    if (state.initKey !== initKey) {
      await sdk.login(playerId);
      state.initKey = initKey;
    }
    return sdk;
  }

  const iosRequirement = getIosPwaRequirementMessage();

  if (iosRequirement) {
    throw new Error(iosRequirement);
  }

  state.initKey = initKey;
  state.initPromise = (async () => {
    let lastError = null;

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        // #region agent log
        agentDebugLog("F", "onesignal-client.js:attempt", "init attempt", {
          attempt,
          online: navigator.onLine,
          visibility: document.visibilityState,
        });
        // #endregion

        return await runInitializeOneSignal(appId, playerId);
      } catch (error) {
        lastError = error;

        // #region agent log
        agentDebugLog("F", "onesignal-client.js:attemptFailed", "init attempt failed", {
          attempt,
          error: error?.message ?? String(error),
          transient: isTransientNetworkError(error),
          alreadyInitialized: isAlreadyInitializedError(error),
        });
        // #endregion

        if (isAlreadyInitializedError(error)) {
          const OneSignal = await acquireOneSignalSdk();
          state.initCompleted = true;
          await OneSignal.login(playerId);
          state.instance = OneSignal;
          return OneSignal;
        }

        if (!isTransientNetworkError(error) || attempt === 4) {
          throw error;
        }

        const failedScript = document.getElementById("onesignal-sdk");
        if (failedScript?.dataset?.failed === "true") {
          failedScript.remove();
        }

        await wait(500 * attempt);
        await waitForOnline();
      }
    }

    throw lastError ?? new Error("Pushdienst kon niet starten.");
  })();

  try {
    return await state.initPromise;
  } catch (error) {
    // #region agent log
    agentDebugLog(
      "B",
      "onesignal-client.js:initCatch",
      "initializeOneSignal failed, resetting promise",
      {
        error: error?.message ?? String(error),
        initCompleted: state.initCompleted,
        hasInstance: !!state.instance,
      }
    );
    // #endregion

    // Keep initCompleted if OneSignal.init already succeeded so retries never call init twice.
    state.initPromise = null;
    if (!state.initCompleted) {
      state.initKey = null;
    }
    if (!state.instance) {
      throw error;
    }
    return state.instance;
  }
}

export async function waitForOneSignal() {
  const state = getPageState();

  if (state.instance) {
    return state.instance;
  }

  if (state.initPromise) {
    return state.initPromise;
  }

  throw new Error("Pushdienst is nog niet gestart. Vernieuw de pagina.");
}

export async function isPushSubscribed(OneSignal) {
  if (!OneSignal) {
    return false;
  }

  if (OneSignal.User?.PushSubscription?.optedIn) {
    return true;
  }

  const nativePermission = OneSignal.Notifications?.permissionNative;
  return nativePermission === "granted" && OneSignal.Notifications?.permission === true;
}

function getSubscriptionSnapshot(OneSignal) {
  const subscription = OneSignal?.User?.PushSubscription;

  return {
    hasSubscription: !!subscription,
    optedIn: subscription?.optedIn === true,
    permission: OneSignal?.Notifications?.permission ?? null,
    permissionNative: OneSignal?.Notifications?.permissionNative ?? null,
    subscriptionId: subscription?.id ?? null,
    hasToken: Boolean(subscription?.token),
  };
}

export async function enablePushForPlayer(OneSignal, playerId) {
  // #region agent log
  agentDebugLog("G", "onesignal-client.js:enable:start", "enablePushForPlayer start", {
    playerId,
    ...getSubscriptionSnapshot(OneSignal),
  });
  // #endregion

  await OneSignal.login(playerId);

  // #region agent log
  agentDebugLog("G", "onesignal-client.js:enable:afterLogin", "login completed", {
    ...getSubscriptionSnapshot(OneSignal),
  });
  // #endregion

  await OneSignal.Notifications.requestPermission();

  // #region agent log
  agentDebugLog("G", "onesignal-client.js:enable:afterPermission", "permission requested", {
    ...getSubscriptionSnapshot(OneSignal),
  });
  // #endregion

  await OneSignal.User.PushSubscription.optIn();

  // #region agent log
  agentDebugLog("G", "onesignal-client.js:enable:afterOptIn", "optIn completed", {
    ...getSubscriptionSnapshot(OneSignal),
  });
  // #endregion

  const subscribed = await isPushSubscribed(OneSignal);

  if (!subscribed) {
    const nativePermission = OneSignal.Notifications?.permissionNative;

    if (nativePermission === "denied") {
      throw new Error(
        "Meldingen werden geblokkeerd. Zet ze aan in Instellingen → Squad Planner → Meldingen."
      );
    }

    throw new Error(
      "Kon pushmeldingen niet activeren. Geef toestemming wanneer je browser daarom vraagt."
    );
  }

  return true;
}

export async function disablePushSubscription(OneSignal, playerId = null) {
  // #region agent log
  agentDebugLog("H", "onesignal-client.js:disable:start", "disablePushSubscription start", {
    playerId,
    ...getSubscriptionSnapshot(OneSignal),
  });
  // #endregion

  if (!OneSignal?.User?.PushSubscription) {
    // #region agent log
    agentDebugLog("H", "onesignal-client.js:disable:no-sub", "no PushSubscription object", {});
    // #endregion
    return false;
  }

  if (playerId) {
    // #region agent log
    agentDebugLog("H", "onesignal-client.js:disable:beforeLogin", "login before optOut", {
      playerId,
    });
    // #endregion
    await OneSignal.login(playerId);
    // #region agent log
    agentDebugLog("H", "onesignal-client.js:disable:afterLogin", "login completed", {
      ...getSubscriptionSnapshot(OneSignal),
    });
    // #endregion
  }

  const snapshot = getSubscriptionSnapshot(OneSignal);

  // After a PWA reopen the DB can say "enabled" while the SDK subscription is already
  // opted out / not hydrated. Calling optOut() then hits iOS IndexedDB and can hang forever.
  if (!snapshot.optedIn) {
    // #region agent log
    agentDebugLog(
      "H",
      "onesignal-client.js:disable:skipOptOut",
      "already opted out — skip optOut()",
      snapshot
    );
    // #endregion
    return false;
  }

  // #region agent log
  agentDebugLog("H", "onesignal-client.js:disable:beforeOptOut", "calling optOut()", snapshot);
  // #endregion

  await OneSignal.User.PushSubscription.optOut();

  // #region agent log
  agentDebugLog("H", "onesignal-client.js:disable:afterOptOut", "optOut completed", {
    ...getSubscriptionSnapshot(OneSignal),
  });
  // #endregion

  return true;
}

export async function withNetworkRetry(task, { attempts = 4, label = "request" } = {}) {
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await waitForOnline();
      return await task();
    } catch (error) {
      lastError = error;

      // #region agent log
      agentDebugLog("F", "onesignal-client.js:withNetworkRetry", `${label} failed`, {
        attempt,
        error: error?.message ?? String(error),
        transient: isTransientNetworkError(error),
      });
      // #endregion

      if (!isTransientNetworkError(error) || attempt === attempts) {
        throw error;
      }

      await wait(400 * attempt);
    }
  }

  throw lastError;
}
