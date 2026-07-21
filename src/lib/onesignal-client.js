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

function ensureOneSignalDeferred() {
  if (typeof window === "undefined") {
    return null;
  }

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  return window.OneSignalDeferred;
}

export function loadOneSignalScript() {
  if (typeof document === "undefined") {
    return;
  }

  if (document.getElementById("onesignal-sdk")) {
    return;
  }

  const script = document.createElement("script");
  script.id = "onesignal-sdk";
  script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
  script.defer = true;
  document.head.appendChild(script);
}

export function waitForOneSignal(timeoutMs = 12000) {
  const deferred = ensureOneSignalDeferred();

  if (!deferred) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error("Pushdienst reageert niet. Vernieuw de pagina en probeer opnieuw."));
    }, timeoutMs);

    deferred.push(async (OneSignal) => {
      window.clearTimeout(timer);
      resolve(OneSignal);
    });
  });
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
        "Meldingen werden geblokkeerd. Zet ze aan in je browser- of telefooninstellingen."
      );
    }

    throw new Error(
      "Kon pushmeldingen niet activeren. Probeer opnieuw of geef toestemming in je browser."
    );
  }

  return true;
}

export async function disablePushSubscription(OneSignal) {
  if (OneSignal?.User?.PushSubscription?.optOut) {
    await OneSignal.User.PushSubscription.optOut();
  }
}
