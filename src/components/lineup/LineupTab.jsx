"use client";

import { useEffect, useMemo } from "react";

import { PublishedLineup } from "@/components/lineup/PublishedLineup";
import { EventTitleBlock } from "@/components/events/EventTitleBlock";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  formatEventDate,
  formatEventTime,
} from "@/lib/events";
import { getPublishedLineup } from "@/lib/lineups";

export function LineupTab({
  events,
  lineups,
  currentPlayerId,
  onLineupViewed,
}) {
  const publishedMatches = useMemo(
    () =>
      events
        .filter(
          (event) => event.type === "match" && getPublishedLineup(lineups, event.id)
        )
        .sort((a, b) => a.date.localeCompare(b.date)),
    [events, lineups]
  );

  useEffect(() => {
    publishedMatches.forEach((event) => onLineupViewed?.(event.id));
  }, [publishedMatches, onLineupViewed]);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Opstellingen</h2>

      {publishedMatches.length === 0 ? (
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
                  <EventTitleBlock event={event} />
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
