"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePlayers } from "@/context/PlayersContext";
import { getPlayerSeasonAttendance } from "@/lib/attendance";
import { formatEventDate, getEventTitle, toDateString } from "@/lib/events";
import { getPlayerMatchStats, getSeasonTotals } from "@/lib/stats";
import { cn } from "@/lib/utils";

function formatShortDate(dateString) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString("nl-BE", {
    day: "numeric",
    month: "short",
  });
}

export function AttendanceOverview({ events, attendance, matchStats = {} }) {
  const { players } = usePlayers();
  const [expandedId, setExpandedId] = useState(null);

  const squadPlayers = useMemo(
    () =>
      players
        .filter((player) => player.isSquadPlayer)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [players]
  );

  const pastOrToday = useMemo(() => {
    const today = toDateString(new Date());
    return events
      .filter(
        (event) =>
          event.date <= today &&
          (event.type === "training" || event.type === "match")
      )
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [events]);

  const rows = useMemo(
    () =>
      squadPlayers.map((player) => ({
        player,
        season: getPlayerSeasonAttendance(attendance, player.id, pastOrToday),
      })),
    [squadPlayers, attendance, pastOrToday]
  );

  if (squadPlayers.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Overzicht</h2>
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Geen squad-spelers.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Overzicht</h2>
        <p className="text-sm text-muted-foreground">
          Tik op een speler voor trainingen, minuten en goals/assists per wedstrijd.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-2 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
          <span>Speler</span>
          <span className="w-16 text-center sm:w-20">Training</span>
          <span className="w-16 text-center sm:w-20">Wedstrijd</span>
          <span className="w-12 text-right sm:w-14">Min</span>
        </div>

        <ul className="divide-y">
          {rows.map(({ player, season }) => {
            const expanded = expandedId === player.id;
            const hasDetail =
              season.trainingCount > 0 || season.matchCount > 0;
            const totals = getSeasonTotals(matchStats, player.id);

            return (
              <li key={player.id}>
                <button
                  type="button"
                  className={cn(
                    "grid w-full grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/40",
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
                  <span className="w-16 text-center tabular-nums sm:w-20">
                    {season.trainingCount}
                  </span>
                  <span className="w-16 text-center tabular-nums sm:w-20">
                    {season.matchCount}
                  </span>
                  <span className="w-12 text-right text-sm font-semibold tabular-nums sm:w-14">
                    {season.totalMinutes}
                  </span>
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
                          {totals.goals > 0 && (
                            <Badge variant="present">{totals.goals} goals</Badge>
                          )}
                          {totals.assists > 0 && (
                            <Badge variant="secondary">{totals.assists} assists</Badge>
                          )}
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
                                    {(hasGoals || hasAssists) && (
                                      <span className="flex shrink-0 gap-1.5">
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
