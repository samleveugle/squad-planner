const DEFAULT_RESET_ERROR = "Kon resetlink niet versturen.";
const DEFAULT_ALERT_ERROR = "Er ging iets mis. Probeer opnieuw.";

function mapKnownAuthError(message) {
  const normalized = message.toLowerCase();

  if (normalized.includes("fetch failed") || normalized.includes("network")) {
    return "Verbinding mislukt. Controleer je internet en probeer opnieuw.";
  }

  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Te veel pogingen. Wacht even en probeer opnieuw.";
  }

  return message;
}

export function toAuthUserMessage(error, fallback = DEFAULT_RESET_ERROR) {
  if (typeof error === "string") {
    const trimmed = error.trim();
    if (trimmed) {
      return mapKnownAuthError(trimmed);
    }
  }

  if (error && typeof error.message === "string") {
    const trimmed = error.message.trim();
    if (trimmed) {
      return mapKnownAuthError(trimmed);
    }
  }

  return fallback;
}

export function formatAlertMessage(message, fallback = DEFAULT_ALERT_ERROR) {
  if (typeof message === "string") {
    const trimmed = message.trim();
    if (trimmed && trimmed !== "{}" && trimmed !== "[]") {
      return trimmed;
    }
  }

  return fallback;
}
