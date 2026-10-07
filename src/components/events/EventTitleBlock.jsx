import { CardTitle } from "@/components/ui/card";
import {
  formatMatchScoreLine,
  getEventMatchDetail,
  getEventTypeLabel,
} from "@/lib/events";

export function EventTitleBlock({ event, variant = "card" }) {
  const matchDetail = getEventMatchDetail(event);
  const label = getEventTypeLabel(event);
  const scoreLine = formatMatchScoreLine(event);

  if (variant === "card") {
    return (
      <div className="space-y-0.5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0">
          <CardTitle className="text-lg">{label}</CardTitle>
          {scoreLine && (
            <p className="text-2xl font-semibold tabular-nums leading-none tracking-tight">
              {scoreLine}
            </p>
          )}
        </div>
        {matchDetail && <p className="text-sm font-medium">{matchDetail}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0">
        <p className="font-medium">{label}</p>
        {scoreLine && (
          <p className="text-lg font-semibold tabular-nums leading-none">{scoreLine}</p>
        )}
      </div>
      {matchDetail && <p className="text-sm text-muted-foreground">{matchDetail}</p>}
    </div>
  );
}
