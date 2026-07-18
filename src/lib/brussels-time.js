const BRUSSELS_TIMEZONE = "Europe/Brussels";

function getBrusselsParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: BRUSSELS_TIMEZONE,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value])
  );

  return {
    weekday: lookup.weekday,
    hour: Number(lookup.hour),
    minute: Number(lookup.minute),
  };
}

export function isAvailabilityReminderWindow(date = new Date()) {
  const { weekday, hour } = getBrusselsParts(date);

  // Vercel Hobby: cron draait max 1×/dag (~19:00 UTC, ±59 min).
  // Dat komt neer op zondagavond 20:00–21:59 in Brussels (winter/zomer + jitter).
  return weekday === "Sun" && hour >= 19 && hour <= 21;
}

export function formatBrusselsDateTime(date = new Date()) {
  return new Intl.DateTimeFormat("nl-BE", {
    timeZone: BRUSSELS_TIMEZONE,
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}
