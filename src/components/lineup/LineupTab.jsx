"use client";

import { useEffect, useMemo } from "react";

import { PublishedLineup } from "@/components/lineup/PublishedLineup";
import { WeekNavigator } from "@/components/calendar/WeekNavigator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatEventDate,
  formatEventTime,
  getEventTitle,
} from "@/lib/events";
import { getPublishedLineup } from "@/lib/lineups";

export function LineupTab({
  events,
  weekStart,
  onWeekChange,
  lineups,
  currentPlayerId,
  onLineupViewed,
}) {
  const matchEvents = useMemo(
    () => events.filter((event) => event.type === "match"),
    [events]
  );
  const publishedMatches = useMemo(
    () => matchEvents.filter((event) => getPublishedLineup(lineups, event.id)),
    [matchEvents, lineups]
  );

  useEffect(() => {
    publishedMatches.forEach((event) => onLineupViewed?.(event.id));
  }, [publishedMatches, onLineupViewed]);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Opstellingen</h2>

      <WeekNavigator weekStart={weekStart} onWeekChange={onWeekChange} />

      {matchEvents.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-8 text-center">
          <p className="font-medium">Geen wedstrijden deze week</p>
        </div>
      ) : publishedMatches.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-8 text-center">
          <p className="font-medium">Nog geen gepubliceerde opstelling</p>
        </div>
      ) : (
        <div className="space-y-4">
          {publishedMatches.map((event) => {
            const lineup = getPublishedLineup(lineups, event.id);

            return (
              <Card key={event.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{getEventTitle(event)}</CardTitle>
                  <CardDescription>
                    {formatEventDate(event.date)} · {formatEventTime(event)} ·{" "}
                    {event.location}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PublishedLineup
                    lineup={lineup}
                    eventId={event.id}
                    currentPlayerId={currentPlayerId}
                    onView={onLineupViewed}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
