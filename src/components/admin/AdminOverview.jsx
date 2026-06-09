import { AvailabilityBadge } from "@/components/availability/AvailabilityBadge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AVAILABILITY,
  EVENTS,
  PLAYERS,
  formatEventDate,
  getEventTitle,
  getResponseKey,
} from "@/lib/mock-data";

function getPlayersByStatus(eventId, responses, status) {
  return PLAYERS.filter(
    (player) => responses[getResponseKey(player.id, eventId)] === status
  );
}

function PlayerList({ players, emptyText }) {
  if (players.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {players.map((player) => (
        <li
          key={player.id}
          className="rounded-md border bg-background px-2.5 py-1 text-sm"
        >
          {player.name}
        </li>
      ))}
    </ul>
  );
}

function EventAdminCard({ event, responses }) {
  const present = getPlayersByStatus(event.id, responses, "present");
  const doubt = getPlayersByStatus(event.id, responses, "doubt");
  const absent = getPlayersByStatus(event.id, responses, "absent");
  const unanswered = PLAYERS.filter(
    (player) => !responses[getResponseKey(player.id, event.id)]
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{getEventTitle(event)}</CardTitle>
        <CardDescription>
          {formatEventDate(event.date)} · {event.time}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <AvailabilityBadge status="present" />
          <span className="text-sm text-muted-foreground">{present.length} spelers</span>
          <AvailabilityBadge status="doubt" />
          <span className="text-sm text-muted-foreground">{doubt.length} spelers</span>
          <AvailabilityBadge status="absent" />
          <span className="text-sm text-muted-foreground">{absent.length} spelers</span>
        </div>

        <div className="space-y-3">
          <div>
            <p className="mb-2 text-sm font-medium">{AVAILABILITY.present.label}</p>
            <PlayerList
              players={present}
              emptyText="Nog niemand heeft zich aanwezig gemeld."
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">{AVAILABILITY.doubt.label}</p>
            <PlayerList
              players={doubt}
              emptyText="Niemand twijfelt momenteel."
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">{AVAILABILITY.absent.label}</p>
            <PlayerList
              players={absent}
              emptyText="Nog niemand is afwezig gemeld."
            />
          </div>
          {unanswered.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Nog geen antwoord</p>
              <PlayerList players={unanswered} emptyText="" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminOverview({ responses }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Admin-overzicht</h2>
        <p className="text-sm text-muted-foreground">
          Zie per event wie er komt — handig om later een opstelling te maken.
        </p>
      </div>

      <div className="space-y-4">
        {EVENTS.map((event) => (
          <EventAdminCard key={event.id} event={event} responses={responses} />
        ))}
      </div>
    </section>
  );
}
