import { EventCard } from "@/components/calendar/EventCard";
import { WeekNavigator } from "@/components/calendar/WeekNavigator";
import { getResponseKey } from "@/lib/mock-data";

export function WeekView({
  events,
  weekStart,
  onWeekChange,
  currentPlayerId,
  responses,
  onAvailabilityChange,
  lineups,
  onLineupViewed,
}) {
  return (
    <section className="space-y-4">
      <WeekNavigator weekStart={weekStart} onWeekChange={onWeekChange} />

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-8 text-center">
          <p className="font-medium">Geen events deze week</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const responseKey = getResponseKey(currentPlayerId, event.id);

            return (
              <EventCard
                key={event.id}
                event={event}
                value={responses[responseKey] ?? null}
                onChange={(status) => onAvailabilityChange(event.id, status)}
                responses={responses}
                currentPlayerId={currentPlayerId}
                lineups={lineups}
                onLineupViewed={onLineupViewed}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
