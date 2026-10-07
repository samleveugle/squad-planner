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

export function getBrusselsWeekday(date = new Date()) {
  return getBrusselsParts(date).weekday;
}

export function getBrusselsDateString(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: BRUSSELS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value])
  );

  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

export function isAvailabilityReminderWindow(date = new Date()) {
  const { weekday, hour } = getBrusselsParts(date);

  // Vercel Hobby: daily cron at 18:00 UTC, may run up to ~59 min late.
  // 18:00 UTC = 20:00 CEST / 19:00 CET. Exact 20:00 is not guaranteed on Hobby.
  return weekday === "Mon" && hour >= 18 && hour <= 21;
}
