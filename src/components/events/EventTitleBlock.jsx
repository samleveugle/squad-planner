import { CardTitle } from "@/components/ui/card";
import { getEventMatchDetail, getEventTypeLabel } from "@/lib/events";

export function EventTitleBlock({ event, variant = "card" }) {
  const matchDetail = getEventMatchDetail(event);
  const label = getEventTypeLabel(event);

  if (variant === "card") {
    return (
      <div className="space-y-0.5">
        <CardTitle className="text-lg">{label}</CardTitle>
        {matchDetail && <p className="text-sm font-medium">{matchDetail}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <p className="font-medium">{label}</p>
      {matchDetail && <p className="text-sm text-muted-foreground">{matchDetail}</p>}
    </div>
  );
}
