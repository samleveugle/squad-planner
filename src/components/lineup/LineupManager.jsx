import { LineupBuilder } from "@/components/lineup/LineupBuilder";
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
} from "@/lib/mock-data";

export function LineupManager({
  events,
  weekStart,
  onWeekChange,
  responses,
  lineups,
  onSaveLineup,
  onPublishLineup,
  onUnpublishLineup,
}) {
  const matchEvents = events.filter((event) => event.type === "match");

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Opstelling beheren</h2>
        <p className="text-sm text-muted-foreground">
          Stel per wedstrijd een formatie samen, sla op als draft en publiceer
          wanneer je wilt.
        </p>
      </div>

      <WeekNavigator weekStart={weekStart} onWeekChange={onWeekChange} />

      {matchEvents.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-8 text-center">
          <p className="font-medium">Geen wedstrijden deze week</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Blader naar een week met een wedstrijd om een opstelling te maken.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matchEvents.map((event) => (
            <Card key={event.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{getEventTitle(event)}</CardTitle>
                <CardDescription>
                  {formatEventDate(event.date)} · {formatEventTime(event)} ·{" "}
                  {event.location}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LineupBuilder
                  event={event}
                  responses={responses}
                  savedLineup={lineups[event.id] ?? null}
                  onSave={(lineupData) => onSaveLineup(event.id, lineupData)}
                  onPublish={(lineupData) => onPublishLineup(event.id, lineupData)}
                  onUnpublish={() => onUnpublishLineup(event.id)}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
