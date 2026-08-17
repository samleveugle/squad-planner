import { AvailabilityPicker } from "@/components/availability/AvailabilityPicker";
import { EventTeamSummary } from "@/components/availability/EventTeamSummary";
import { EventTitleBlock } from "@/components/events/EventTitleBlock";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { formatEventDate, formatEventTime } from "@/lib/events";

export function EventCard({
  event,
  value,
  onChange,
  availabilityDisabled = false,
  responses,
  currentPlayerId,
}) {
  const isMatch = event.type === "match";
  const isEvenement = event.type === "evenement";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <EventTitleBlock event={event} />
            <CardDescription>
              {formatEventDate(event.date)} · {formatEventTime(event)} ·{" "}
              {event.location}
            </CardDescription>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isEvenement
                ? "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300"
                : isMatch
                  ? event.isHome
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                    : "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300"
                  : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
            }`}
          >
            {isEvenement ? "Evenement" : isMatch ? (event.isHome ? "Thuis" : "Uit") : "Training"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <AvailabilityPicker
            value={value}
            onChange={onChange}
            disabled={availabilityDisabled}
          />
        </div>

        <EventTeamSummary
          eventId={event.id}
          responses={responses}
          currentPlayerId={currentPlayerId}
        />
      </CardContent>
    </Card>
  );
}
