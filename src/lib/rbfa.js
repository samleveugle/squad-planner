const RBFA_GRAPHQL_URL = "https://datalake-prod2018.rbfa.be/graphql";

/** Persisted GraphQL query hashes used by rbfa.be (via community HA integration). */
const OPERATION_HASHES = {
  GetTeamCalendar: "3f0441e6723b9852b4f0cff2c872f4aa674c5de2d23589efc70c7a4ffb7f6383",
  GetMatchDetail: "cd8867b845c206fe7aa75c1ebf7b53cbda0ff030253a45e2e2b4bcc13ee46c9a",
};

const OPERATION_VARIABLES = {
  GetTeamCalendar: "teamId",
  GetMatchDetail: "matchId",
};

function buildPersistedQueryUrl(operationName, value) {
  const variableKey = OPERATION_VARIABLES[operationName];
  const hash = OPERATION_HASHES[operationName];

  const variables = JSON.stringify({
    [variableKey]: String(value),
    language: "nl",
  });
  const extensions = JSON.stringify({
    persistedQuery: { version: 1, sha256Hash: hash },
  });

  const params = new URLSearchParams({
    operationName,
    variables,
    extensions,
  });

  return `${RBFA_GRAPHQL_URL}?${params.toString()}`;
}

async function fetchPersistedQuery(operationName, value) {
  const url = buildPersistedQueryUrl(operationName, value);
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "SquadPlanner/1.0 (FC Hoje calendar sync)",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `RBFA GraphQL ${operationName} faalde met HTTP ${response.status}`
    );
  }

  const payload = await response.json();

  if (payload.errors?.length) {
    throw new Error(
      payload.errors[0]?.message ?? `RBFA GraphQL ${operationName} gaf een fout.`
    );
  }

  return payload.data;
}

export function getRbfaTeamId() {
  return process.env.RBFA_TEAM_ID?.trim() || "360260";
}

export async function fetchTeamCalendar(teamId = getRbfaTeamId()) {
  const data = await fetchPersistedQuery("GetTeamCalendar", teamId);
  return data?.teamCalendar ?? [];
}

export async function fetchMatchDetail(matchId) {
  const data = await fetchPersistedQuery("GetMatchDetail", matchId);
  return data?.matchDetail ?? null;
}

export function formatRbfaLocation(location) {
  if (!location) {
    return "Locatie TBD";
  }

  if (location.name?.trim()) {
    return location.name.trim();
  }

  const cityLine = [location.postalCode, location.city].filter(Boolean).join(" ");
  const parts = [location.address, cityLine].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Locatie TBD";
}

export function mapCalendarItemToMatchFields(item, teamId, location = null) {
  const isHome = String(item.homeTeam?.id) === String(teamId);
  const opponent = isHome ? item.awayTeam?.name : item.homeTeam?.name;
  const startTime = item.startTime ?? "";
  const [datePart, timePart = ""] = startTime.split("T");
  const time = timePart.slice(0, 5) || null;

  return {
    id: `rbfa-${item.id}`,
    type: "match",
    date: datePart,
    time,
    location: formatRbfaLocation(location),
    isHome,
    opponent: opponent?.trim() || null,
    rbfaMatchId: String(item.id),
  };
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = [];

  for (let index = 0; index < items.length; index += limit) {
    const chunk = items.slice(index, index + limit);
    const mapped = await Promise.all(chunk.map(mapper));
    results.push(...mapped);
  }

  return results;
}

/**
 * Fetch team calendar + match locations and map to Squad Planner match events.
 */
export async function fetchRbfaMatchEvents(teamId = getRbfaTeamId()) {
  const calendar = await fetchTeamCalendar(teamId);

  return mapWithConcurrency(calendar, 5, async (item) => {
    let location = null;

    try {
      const detail = await fetchMatchDetail(item.id);
      location = detail?.location ?? null;
    } catch {
      location = null;
    }

    return mapCalendarItemToMatchFields(item, teamId, location);
  });
}
