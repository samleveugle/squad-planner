import { Badge } from "@/components/ui/badge";
import { AVAILABILITY } from "@/lib/mock-data";

export function AvailabilityBadge({ status }) {
  if (!status) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Nog geen antwoord
      </Badge>
    );
  }

  return (
    <Badge variant={status}>{AVAILABILITY[status].shortLabel}</Badge>
  );
}
