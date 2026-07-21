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

export function loadOneSignalScript() {
  if (typeof document === "undefined") {
    return Promise.resolve(false);
  }

  const existing = document.getElementById("onesignal-sdk");

  if (existing) {
    return Promise.resolve(true);
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = "onesignal-sdk";
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () =>
      reject(new Error("Kon pushdienst niet laden. Controleer je internetverbinding."));
    document.head.appendChild(script);
  });
}

let oneSignalInstance = null;
let oneSignalInitPromise = null;
let oneSignalInitKey = null;

export function getOneSignalInstance() {
  return oneSignalInstance;
}

export function resetOneSignalInitForTests() {
  oneSignalInstance = null;
  oneSignalInitPromise = null;
  oneSignalInitKey = null;
}

export async function initializeOneSignal(appId, playerId) {
  const initKey = `${appId}:${playerId}`;

  if (oneSignalInstance && oneSignalInitKey === initKey) {
    return oneSignalInstance;
  }

  if (oneSignalInitPromise && oneSignalInitKey === initKey) {
    return oneSignalInitPromise;
  }

  const iosRequirement = getIosPwaRequirementMessage();

  if (iosRequirement) {
    throw new Error(iosRequirement);
  }

  oneSignalInitKey = initKey;
  oneSignalInitPromise = (async () => {
    await loadOneSignalScript();

    const OneSignal = await new Promise((resolve, reject) => {
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

      deferred.push(async (sdk) => {
        window.clearTimeout(timer);
        resolve(sdk);
      });
    });

    const pushSupported =
      typeof OneSignal.Notifications?.isPushSupported === "function"
        ? OneSignal.Notifications.isPushSupported()
        : true;

    if (!pushSupported) {
      throw new Error(getUnsupportedPushMessage());
    }

    await OneSignal.init({
      appId,
      notifyButton: {
        enable: false,
      },
      serviceWorkerPath: "/OneSignalSDKWorker.js",
    });

    await OneSignal.login(playerId);
    oneSignalInstance = OneSignal;

    return OneSignal;
  })();

  try {
    return await oneSignalInitPromise;
  } catch (error) {
    oneSignalInitPromise = null;
    oneSignalInitKey = null;
    oneSignalInstance = null;
    throw error;
  }
}

export async function waitForOneSignal() {
  if (oneSignalInstance) {
    return oneSignalInstance;
  }

  if (oneSignalInitPromise) {
    return oneSignalInitPromise;
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

export async function disablePushSubscription(OneSignal) {
  if (OneSignal?.User?.PushSubscription?.optOut) {
    await OneSignal.User.PushSubscription.optOut();
  }
}
