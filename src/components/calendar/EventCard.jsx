import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AvailabilityPicker } from "@/components/availability/AvailabilityPicker";
import { EventTeamSummary } from "@/components/availability/EventTeamSummary";
import { PublishedLineup } from "@/components/lineup/PublishedLineup";
import { formatEventDate, formatEventTime, getEventTitle } from "@/lib/mock-data";
import { getPublishedLineup } from "@/lib/lineups";

export function EventCard({
  event,
  value,
  onChange,
  responses,
  currentPlayerId,
  lineups,
  onLineupViewed,
}) {
  const isMatch = event.type === "match";
  const publishedLineup = isMatch ? getPublishedLineup(lineups, event.id) : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{getEventTitle(event)}</CardTitle>
            <CardDescription>
              {formatEventDate(event.date)} · {formatEventTime(event)} ·{" "}
              {event.location}
            </CardDescription>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isMatch
                ? event.isHome
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                  : "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300"
                : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
            }`}
          >
            {isMatch ? (event.isHome ? "Thuis" : "Uit") : "Training"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-3 text-sm text-muted-foreground">Jouw beschikbaarheid</p>
          <AvailabilityPicker value={value} onChange={onChange} />
        </div>

        <EventTeamSummary
          eventId={event.id}
          responses={responses}
          currentPlayerId={currentPlayerId}
        />

        {publishedLineup && (
          <PublishedLineup
            lineup={publishedLineup}
            currentPlayerId={currentPlayerId}
            compact
            onView={() => onLineupViewed?.(event.id)}
          />
        )}
      </CardContent>
    </Card>
  );
}
