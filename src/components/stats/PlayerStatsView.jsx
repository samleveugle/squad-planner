import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatEventDate,
  getEventTitle,
} from "@/lib/events";
import {
  getPlayerMatchHistory,
  getSeasonTotals,
} from "@/lib/stats";

export function PlayerStatsView({ playerId, playerName, matchStats, events }) {
  const totals = getSeasonTotals(matchStats, playerId);
  const history = getPlayerMatchHistory(matchStats, playerId, events);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Mijn seizoensstats</CardTitle>
          <CardDescription>{playerName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
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
        <h3 className="mb-3 text-sm font-semibold">Per wedstrijd</h3>
        {history.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nog geen stats voor jou dit seizoen.
          </p>
        ) : (
          <div className="space-y-2">
            {history.map(({ event, stats }) => (
              <div
                key={event.id}
                className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{getEventTitle(event)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatEventDate(event.date)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="present">{stats.goals} goals</Badge>
                  <Badge variant="secondary">{stats.assists} assists</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
