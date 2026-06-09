import { EventCard } from "@/components/calendar/EventCard";
import { getResponseKey } from "@/lib/mock-data";

export function WeekView({ events, currentPlayerId, responses, onAvailabilityChange }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Deze week</h2>
        <p className="text-sm text-muted-foreground">
          Kies per event of je aanwezig bent, twijfelt of afwezig bent.
        </p>
      </div>

      <div className="space-y-4">
        {events.map((event) => {
          const responseKey = getResponseKey(currentPlayerId, event.id);

          return (
            <EventCard
              key={event.id}
              event={event}
              value={responses[responseKey] ?? null}
              onChange={(status) => onAvailabilityChange(event.id, status)}
            />
          );
        })}
      </div>
    </section>
  );
}
