import { getCACertificates, setDefaultCACertificates } from "node:tls";

let configured = false;

export function useSystemCertificates() {
  if (configured) {
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
