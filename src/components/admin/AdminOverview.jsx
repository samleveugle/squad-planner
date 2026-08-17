"use client";

import { EventTeamSummary } from "@/components/availability/EventTeamSummary";
import { PlayerNameList } from "@/components/availability/PlayerNameList";
import { WeekNavigator } from "@/components/calendar/WeekNavigator";
import { EventTitleBlock } from "@/components/events/EventTitleBlock";
import { usePlayers } from "@/context/PlayersContext";
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

function EventAdminCard({ event, responses }) {
  const { getEventResponseSummary } = usePlayers();
  const { unanswered } = getEventResponseSummary(event.id, responses);

  return (
    <Card>
      <CardHeader className="pb-3">
        <EventTitleBlock event={event} />
        <CardDescription>
          {formatEventDate(event.date)} · {formatEventTime(event)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <EventTeamSummary eventId={event.id} responses={responses} />

        {unanswered.length > 0 && (
          <div className="space-y-2 rounded-lg border bg-muted/40 p-4">
            <p className="text-sm font-medium">Nog geen antwoord</p>
            <PlayerNameList players={unanswered} emptyText="" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminOverview({ events, weekStart, onWeekChange, responses }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Beschikbaarheid</h2>

      <WeekNavigator weekStart={weekStart} onWeekChange={onWeekChange} />

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-8 text-center">
          <p className="font-medium">Geen events deze week</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <EventAdminCard key={event.id} event={event} responses={responses} />
          ))}
        </div>
      )}
    </section>
  );
}
