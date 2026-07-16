"use client";

import { AvailabilityBadge } from "@/components/availability/AvailabilityBadge";
import { PlayerNameList } from "@/components/availability/PlayerNameList";
import { WeekNavigator } from "@/components/calendar/WeekNavigator";
import { usePlayers } from "@/context/PlayersContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AVAILABILITY,
  formatEventDate,
  formatEventTime,
  getEventTitle,
} from "@/lib/mock-data";

function EventAdminCard({ event, responses }) {
  const { getEventResponseSummary } = usePlayers();
  const { present, doubt, absent, unanswered } = getEventResponseSummary(
    event.id,
    responses
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{getEventTitle(event)}</CardTitle>
        <CardDescription>
          {formatEventDate(event.date)} · {formatEventTime(event)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <AvailabilityBadge status="present" />
          <span className="text-sm text-muted-foreground">{present.length}</span>
          <AvailabilityBadge status="doubt" />
          <span className="text-sm text-muted-foreground">{doubt.length}</span>
          <AvailabilityBadge status="absent" />
          <span className="text-sm text-muted-foreground">{absent.length}</span>
        </div>

        <div className="space-y-3">
          <div>
            <p className="mb-2 text-sm font-medium">{AVAILABILITY.present.label}</p>
            <PlayerNameList players={present} emptyText="—" />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">{AVAILABILITY.doubt.label}</p>
            <PlayerNameList players={doubt} emptyText="—" />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">{AVAILABILITY.absent.label}</p>
            <PlayerNameList players={absent} emptyText="—" />
          </div>
          {unanswered.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Nog geen antwoord</p>
              <PlayerNameList players={unanswered} emptyText="" />
            </div>
          )}
        </div>
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
