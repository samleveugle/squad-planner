import { getCACertificates, setDefaultCACertificates } from "node:tls";

let configured = false;

export function useSystemCertificates() {
  if (configured) {
    return;
  }

  // Windows local dev only — on Vercel/Linux default CAs work; overriding breaks Supabase fetch.
  if (process.env.VERCEL === "1" || process.platform !== "win32") {
    configured = true;
    return;
  }

  if (typeof getCACertificates !== "function" || typeof setDefaultCACertificates !== "function") {
    return;
  }

  try {
    setDefaultCACertificates(getCACertificates("system"));
    configured = true;
  } catch {
    // Ignore on older Node versions.
  }
}
