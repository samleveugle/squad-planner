import { MatchStatsForm } from "@/components/stats/MatchStatsForm";
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

export function StatsManager({
  events,
  weekStart,
  onWeekChange,
  matchStats,
  onSaveMatchStats,
}) {
  const matchEvents = events.filter((event) => event.type === "match");

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Stats invoeren</h2>
        <p className="text-sm text-muted-foreground">
          Vul na afloop van een wedstrijd goals en assists in per speler.
        </p>
      </div>

      <WeekNavigator weekStart={weekStart} onWeekChange={onWeekChange} />

      {matchEvents.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-8 text-center">
          <p className="font-medium">Geen wedstrijden deze week</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Blader naar een week met een wedstrijd om stats in te vullen.
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
                <MatchStatsForm
                  event={event}
                  matchStats={matchStats}
                  onSave={onSaveMatchStats}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
