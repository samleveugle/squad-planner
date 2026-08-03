import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPlayerSeasonAttendance } from "@/lib/attendance";
import { formatEventDate, getEventTitle } from "@/lib/events";
import { getPlayerMatchStats, getSeasonTotals } from "@/lib/stats";

export function PlayerStatsView({
  playerId,
  playerName,
  matchStats,
  attendance,
  events,
}) {
  const season = getPlayerSeasonAttendance(attendance, playerId, events);
  const totals = getSeasonTotals(matchStats, playerId);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Mijn seizoen</CardTitle>
          <CardDescription>{playerName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              {season.trainingCount} trainingen
            </Badge>
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              {season.matchCount} wedstrijden
            </Badge>
            <Badge variant="present" className="px-3 py-1 text-sm">
              {season.totalMinutes} min
            </Badge>
            <Badge variant="present" className="px-3 py-1 text-sm">
              {totals.goals} goals
            </Badge>
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              {totals.assists} assists
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Trainingen</h3>
        {season.trainings.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nog geen trainingen geregistreerd.
          </p>
        ) : (
          <div className="space-y-2">
            {season.trainings.map(({ event }) => (
              <div
                key={event.id}
                className="rounded-lg border bg-card p-3"
              >
                <p className="font-medium">{formatEventDate(event.date)}</p>
                <p className="text-xs text-muted-foreground">{event.location}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Wedstrijden</h3>
        {season.matches.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nog geen wedstrijden geregistreerd.
          </p>
        ) : (
          <div className="space-y-2">
            {season.matches.map(({ event, minutes }) => {
              const stats = getPlayerMatchStats(matchStats, event.id, playerId);

              return (
                <div
                  key={event.id}
                  className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{getEventTitle(event)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatEventDate(event.date)} · {minutes ?? 0} min
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="present">{stats.goals} goals</Badge>
                    <Badge variant="secondary">{stats.assists} assists</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
