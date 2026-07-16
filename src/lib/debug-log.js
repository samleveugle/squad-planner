const DEBUG_INGEST =
  "http://127.0.0.1:7891/ingest/2b6b089d-7eb8-434a-b07c-a2e87411d81f";
const DEBUG_SESSION = "e7c990";

export function debugLog(location, message, data, hypothesisId) {
  const payload = {
    sessionId: DEBUG_SESSION,
    location,
    message,
    data,
    hypothesisId,
    timestamp: Date.now(),
  };

  // #region agent log
  fetch(DEBUG_INGEST, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": DEBUG_SESSION,
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
  // #endregion

  console.error("[squad-debug]", payload);
}

export function getEnvDiagnostics() {
  return {
    vercel: process.env.VERCEL === "1",
    nodeEnv: process.env.NODE_ENV ?? null,
    hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
    hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    hasSiteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim()),
    supabaseUrlHost: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL.trim()).host
      : null,
  };
}

export function formatFetchError(error, step) {
  const cause = error?.cause;

  return {
    step,
    name: error?.name ?? null,
    message: error?.message ?? null,
    causeCode: cause?.code ?? null,
    causeMessage: cause?.message ?? null,
    ...getEnvDiagnostics(),
  };
}
