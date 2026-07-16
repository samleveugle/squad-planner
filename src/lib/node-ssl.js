import { getCACertificates, setDefaultCACertificates } from "node:tls";

import { debugLog } from "@/lib/debug-log";

let configured = false;

export function useSystemCertificates() {
  if (configured) {
    return;
  }

  const skipReason =
    process.env.VERCEL === "1"
      ? "vercel"
      : process.platform !== "win32"
        ? "non-windows"
        : null;

  if (skipReason) {
    configured = true;

    // #region agent log
    debugLog(
      "node-ssl.js:useSystemCertificates",
      "skipped",
      { skipReason, vercel: process.env.VERCEL === "1", platform: process.platform },
      "A"
    );
    // #endregion

    return;
  }

  // #region agent log
  debugLog(
    "node-ssl.js:useSystemCertificates",
    "called",
    {
      vercel: process.env.VERCEL === "1",
      platform: process.platform,
      hasGetCa: typeof getCACertificates === "function",
      hasSetCa: typeof setDefaultCACertificates === "function",
    },
    "A"
  );
  // #endregion

  if (typeof getCACertificates !== "function" || typeof setDefaultCACertificates !== "function") {
    return;
  }

  try {
    setDefaultCACertificates(getCACertificates("system"));
    configured = true;

    // #region agent log
    debugLog("node-ssl.js:useSystemCertificates", "configured system CA", { configured: true }, "A");
    // #endregion
  } catch (error) {
    // #region agent log
    debugLog(
      "node-ssl.js:useSystemCertificates",
      "configure failed",
      { message: error?.message ?? null },
      "A"
    );
    // #endregion
  }
}
