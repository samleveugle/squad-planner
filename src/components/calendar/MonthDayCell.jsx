import { cn } from "@/lib/utils";
import { getEventMarkers } from "@/lib/calendar";

export function MonthDayCell({ cell, events, onSelect }) {
  const { dayNumber, inMonth, inSeason, isToday, dateString, date } = cell;
  const markers = getEventMarkers(events);
  const isClickable = inMonth && inSeason;

  return (
    <button
      type="button"
      disabled={!isClickable}
      onClick={() => isClickable && onSelect(date)}
      className={cn(
        "flex min-h-12 flex-col items-center rounded-md border p-1 text-xs transition-colors sm:min-h-14",
        !inMonth && "border-transparent bg-transparent text-transparent",
        inMonth && !inSeason && "cursor-not-allowed border-transparent bg-muted/30 text-muted-foreground/50",
        inMonth &&
          inSeason &&
          "border-border bg-card hover:bg-accent hover:text-accent-foreground",
        isToday && inSeason && "ring-2 ring-emerald-500 ring-offset-1"
      )}
    >
      <span className={cn("font-medium", isToday && "text-emerald-600")}>
        {inMonth ? dayNumber : ""}
      </span>

      {inMonth && inSeason && (
        <div className="mt-1 flex gap-0.5">
          {markers.hasTraining && (
            <span
              className="h-1.5 w-1.5 rounded-full bg-emerald-500"
              title="Training"
            />
          )}
          {markers.hasHomeMatch && (
            <span
              className="h-1.5 w-1.5 rounded-full bg-blue-500"
              title="Thuiswedstrijd"
            />
          )}
          {markers.hasAwayMatch && (
            <span
              className="h-1.5 w-1.5 rounded-full bg-blue-500"
              title="Uitwedstrijd"
            />
          )}
        </div>
      )}
    </button>
  );
}
