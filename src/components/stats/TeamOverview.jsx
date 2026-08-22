"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SeasonSelector } from "@/components/stats/SeasonSelector";
import { usePlayers } from "@/context/PlayersContext";
import { getPlayerSeasonAttendance } from "@/lib/attendance";
import { formatEventDate, getEventTitle } from "@/lib/events";
import {
  filterEventsForSeasonStats,
  getSeasonMatchEventIds,
} from "@/lib/seasons";
import { getPlayerMatchStats, getSeasonTotals } from "@/lib/stats";
import { cn } from "@/lib/utils";

const DEFAULT_FILTER = "general";

const TEAM_FILTERS = [
  { id: "general", label: "Algemeen" },
  { id: "trainings", label: "Trainingen" },
  { id: "matches", label: "Wedstrijden" },
  { id: "minutes", label: "Speelminuten" },
  { id: "goals", label: "Goals" },
  { id: "assists", label: "Assists" },
  { id: "yellowCards", label: "Gele kaarten" },
  { id: "redCards", label: "Rode kaarten" },
];

function formatShortDate(dateString) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "short",
  });
}

function getFilterValue(season, totals, filterId) {
  switch (filterId) {
    case "goals":
      return totals.goals;
    case "assists":
      return totals.assists;
    case "yellowCards":
      return totals.yellowCards;
    case "redCards":
      return totals.redCards;
    case "matches":
      return season.matchCount;
    case "minutes":
      return season.totalMinutes;
    case "trainings":
      return season.trainingCount;
    default:
      return 0;
  }
}

function getFilterColumnLabel(filterId) {
  return TEAM_FILTERS.find((filter) => filter.id === filterId)?.label ?? "";
}

function isGeneralFilter(filterId) {
  return filterId === "general";
}

export function TeamOverview({
  events,
  attendance,
  matchStats = {},
  seasonId,
  availableSeasonIds,
  onSeasonChange,
}) {
  const { players } = usePlayers();
  const [expandedId, setExpandedId] = useState(null);
  const [activeFilter, setActiveFilter] = useState(DEFAULT_FILTER);

  const squadPlayers = useMemo(
    () =>
      players
        .filter((player) => player.isSquadPlayer)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [players]
  );

  const pastOrToday = useMemo(() => {
    return filterEventsForSeasonStats(events, seasonId)
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [events, seasonId]);

  const seasonMatchEventIds = useMemo(
    () => getSeasonMatchEventIds(events, seasonId),
    [events, seasonId]
  );

  const rows = useMemo(() => {
    const mapped = squadPlayers.map((player) => {
      const season = getPlayerSeasonAttendance(attendance, player.id, pastOrToday);
      const totals = getSeasonTotals(matchStats, player.id, seasonMatchEventIds);

      return {
        player,
        season,
        totals,
        filterValue: getFilterValue(season, totals, activeFilter),
      };
    });

    if (isGeneralFilter(activeFilter)) {
      return mapped.sort((a, b) => a.player.name.localeCompare(b.player.name));
    }

    return mapped.sort((a, b) => {
      const diff = b.filterValue - a.filterValue;
      if (diff !== 0) {
        return diff;
      }
      return a.player.name.localeCompare(b.player.name);
    });
  }, [squadPlayers, attendance, pastOrToday, matchStats, activeFilter, seasonMatchEventIds]);

  const showGeneralColumns = isGeneralFilter(activeFilter);
  const statColumnLabel = getFilterColumnLabel(activeFilter);

  function handleFilterChange(filterId) {
    setActiveFilter((current) =>
      current === filterId ? DEFAULT_FILTER : filterId
    );
  }

  if (squadPlayers.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Team</h2>
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Geen squad-spelers.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Team</h2>
          <p className="text-sm text-muted-foreground">
            Filter op statistiek of tik op een speler voor het volledige overzicht.
          </p>
        </div>
        <SeasonSelector
          seasonId={seasonId}
          availableSeasonIds={availableSeasonIds}
          onSeasonChange={onSeasonChange}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {TEAM_FILTERS.map((filter) => (
          <Button
            key={filter.id}
            type="button"
            size="sm"
            variant={activeFilter === filter.id ? "default" : "outline"}
            className="h-8"
            onClick={() => handleFilterChange(filter.id)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div
          className={cn(
            "grid gap-2 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground",
            showGeneralColumns
              ? "grid-cols-[minmax(0,1fr)_auto_auto_auto]"
              : "grid-cols-[minmax(0,1fr)_auto]"
          )}
        >
          <span>Speler</span>
          {showGeneralColumns ? (
            <>
              <span className="w-16 text-center sm:w-20">Training</span>
              <span className="w-16 text-center sm:w-20">Wedstrijd</span>
              <span className="w-12 text-right sm:w-20">Min</span>
            </>
          ) : (
            <span className="w-16 text-right sm:w-24">{statColumnLabel}</span>
          )}
        </div>

        <ul className="divide-y">
          {rows.map(({ player, season, totals, filterValue }) => {
            const expanded = expandedId === player.id;
            const hasDetail =
              season.trainingCount > 0 || season.matchCount > 0;

            return (
              <li key={player.id}>
                <button
                  type="button"
                  className={cn(
                    "grid w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/40",
                    showGeneralColumns
                      ? "grid-cols-[minmax(0,1fr)_auto_auto_auto]"
                      : "grid-cols-[minmax(0,1fr)_auto]",
                    expanded && "bg-muted/30"
                  )}
                  onClick={() =>
                    setExpandedId((current) =>
                      current === player.id ? null : player.id
                    )
                  }
                  aria-expanded={expanded}
                >
                  <span className="truncate font-medium">{player.name}</span>
                  {showGeneralColumns ? (
                    <>
                      <span className="w-16 text-center tabular-nums sm:w-20">
                        {season.trainingCount}
                      </span>
                      <span className="w-16 text-center tabular-nums sm:w-20">
                        {season.matchCount}
                      </span>
                      <span className="w-12 text-right text-sm font-semibold tabular-nums sm:w-20">
                        {season.totalMinutes}
                      </span>
                    </>
                  ) : (
                    <span className="w-16 text-right text-sm font-semibold tabular-nums text-emerald-700 sm:w-24 dark:text-emerald-400">
                      {filterValue}
                    </span>
                  )}
                </button>

                {expanded && (
                  <div className="space-y-3 border-t bg-muted/20 px-3 py-3 text-sm">
                    {!hasDetail ? (
                      <p className="text-muted-foreground">
                        Nog geen aanwezigheid.
                      </p>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">
                            {season.trainingCount} trainingen
                          </Badge>
                          <Badge variant="secondary">
                            {season.matchCount} wedstrijden
                          </Badge>
                          <Badge variant="present">
                            {season.totalMinutes} min
                          </Badge>
                          <Badge variant="present">{totals.goals} goals</Badge>
                          <Badge variant="secondary">{totals.assists} assists</Badge>
                          <Badge variant="outline">
                            {totals.yellowCards} gele kaarten
                          </Badge>
                          <Badge variant="outline">
                            {totals.redCards} rode kaarten
                          </Badge>
                        </div>

                        {season.trainings.length > 0 && (
                          <div>
                            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Trainingen
                            </p>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                              {season.trainings
                                .map(({ event }) => formatShortDate(event.date))
                                .join(" · ")}
                            </p>
                          </div>
                        )}

                        {season.matches.length > 0 && (
                          <div>
                            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Wedstrijden
                            </p>
                            <ul className="space-y-1">
                              {season.matches.map(({ event, minutes }) => {
                                const stats = getPlayerMatchStats(
                                  matchStats,
                                  event.id,
                                  player.id
                                );
                                const hasGoals = stats.goals > 0;
                                const hasAssists = stats.assists > 0;
                                const hasYellow = stats.yellowCards > 0;
                                const hasRed = stats.redCards > 0;

                                return (
                                  <li
                                    key={event.id}
                                    className="flex items-baseline justify-between gap-3"
                                  >
                                    <span className="min-w-0 truncate">
                                      <span className="font-medium tabular-nums">
                                        {minutes ?? 0}′
                                      </span>
                                      <span className="text-muted-foreground">
                                        {" "}
                                        · {getEventTitle(event)} ·{" "}
                                        {formatEventDate(event.date)}
                                      </span>
                                    </span>
                                    {(hasGoals ||
                                      hasAssists ||
                                      hasYellow ||
                                      hasRed) && (
                                      <span className="flex shrink-0 flex-wrap justify-end gap-1.5">
                                        {hasGoals && (
                                          <Badge variant="present">
                                            {stats.goals} goals
                                          </Badge>
                                        )}
                                        {hasAssists && (
                                          <Badge variant="secondary">
                                            {stats.assists} assists
                                          </Badge>
                                        )}
                                        {hasYellow && (
                                          <Badge variant="outline">
                                            {stats.yellowCards} geel
                                          </Badge>
                                        )}
                                        {hasRed && (
                                          <Badge variant="outline">
                                            {stats.redCards} rood
                                          </Badge>
                                        )}
                                      </span>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}

                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-muted-foreground"
                          onClick={() => setExpandedId(null)}
                        >
                          Sluiten
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
