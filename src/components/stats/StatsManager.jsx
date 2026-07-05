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
  lineups,
  onSaveMatchStats,
}) {
  const matchEvents = events.filter((event) => event.type === "match");

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Stats invoeren</h2>

      <WeekNavigator weekStart={weekStart} onWeekChange={onWeekChange} />

      {matchEvents.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-8 text-center">
          <p className="font-medium">Geen wedstrijden deze week</p>
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
                  lineups={lineups}
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
