import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AvailabilityPicker } from "@/components/availability/AvailabilityPicker";
import { formatEventDate, getEventTitle } from "@/lib/mock-data";

export function EventCard({ event, value, onChange }) {
  const isMatch = event.type === "match";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{getEventTitle(event)}</CardTitle>
            <CardDescription>
              {formatEventDate(event.date)} · {event.time} · {event.location}
            </CardDescription>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isMatch
                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
            }`}
          >
            {isMatch ? "Wedstrijd" : "Training"}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">Jouw beschikbaarheid</p>
        <AvailabilityPicker value={value} onChange={onChange} />
      </CardContent>
    </Card>
  );
}
