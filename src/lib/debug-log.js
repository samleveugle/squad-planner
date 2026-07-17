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
