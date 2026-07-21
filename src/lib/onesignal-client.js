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

export function loadOneSignalScript() {
  if (typeof document === "undefined") {
    return Promise.resolve(false);
  }

  const existing = document.getElementById("onesignal-sdk");

  if (existing) {
    if (existing.dataset.failed === "true") {
      existing.remove();
    } else {
      return Promise.resolve(true);
    }
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = "onesignal-sdk";
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js?v=160606";
    script.defer = true;
    script.onload = () => resolve(true);
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

    const timer = window.setTimeout(() => {
      reject(
        new Error(
          "Pushdienst reageert niet. Sluit de app volledig, open opnieuw vanaf je beginscherm en probeer opnieuw."
        )
      );
    }, 20000);

    deferred.push((sdk) => {
      window.clearTimeout(timer);
      resolve(sdk);
    });
  });
}

async function initOneSignalSdk(OneSignal, appId) {
  const state = getPageState();

  if (state.initCompleted && state.instance) {
    return state.instance;
  }

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

  return OneSignal;
}

export function getOneSignalInstance() {
  return getPageState().instance;
}

export async function initializeOneSignal(appId, playerId) {
  const initKey = `${appId}:${playerId}`;
  const state = getPageState();

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
        return await runInitializeOneSignal(appId, playerId);
      } catch (error) {
        lastError = error;

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

export async function enablePushForPlayer(OneSignal, playerId) {
  await OneSignal.login(playerId);
  await OneSignal.Notifications.requestPermission();
  await OneSignal.User.PushSubscription.optIn();

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
  if (!OneSignal?.User?.PushSubscription) {
    return false;
  }

  if (playerId) {
    await OneSignal.login(playerId);
  }

  // After a PWA reopen the DB can say "enabled" while the SDK subscription is already
  // opted out / not hydrated. Calling optOut() then hits iOS IndexedDB and can hang forever.
  if (OneSignal.User.PushSubscription.optedIn !== true) {
    return false;
  }

  await OneSignal.User.PushSubscription.optOut();
  return true;
}

export async function withNetworkRetry(task, { attempts = 4 } = {}) {
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await waitForOnline();
      return await task();
    } catch (error) {
      lastError = error;

      if (!isTransientNetworkError(error) || attempt === attempts) {
        throw error;
      }

      await wait(400 * attempt);
    }
  }

  throw lastError;
}
