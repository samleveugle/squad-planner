const ONESIGNAL_API_URL = "https://api.onesignal.com/notifications";

export function getOneSignalConfig() {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !restApiKey) {
    return null;
  }

  return { appId, restApiKey };
}

export async function sendPushToExternalIds({
  externalIds,
  heading,
  message,
  url,
}) {
  const config = getOneSignalConfig();

  if (!config) {
    throw new Error("OneSignal is niet geconfigureerd.");
  }

  if (!externalIds.length) {
    return { id: null, recipients: 0 };
  }

  const response = await fetch(ONESIGNAL_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${config.restApiKey}`,
    },
    body: JSON.stringify({
      app_id: config.appId,
      include_aliases: {
        external_id: externalIds,
      },
      target_channel: "push",
      headings: { en: heading, nl: heading },
      contents: { en: message, nl: message },
      url: url ?? process.env.NEXT_PUBLIC_SITE_URL ?? "/",
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.errors?.[0] ?? "Kon pushmelding niet versturen.");
  }

  return {
    id: payload.id ?? null,
    recipients: payload.recipients ?? externalIds.length,
  };
}
