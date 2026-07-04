import { Bell, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getEventTitle } from "@/lib/mock-data";

export function LineupNotificationBanner({
  unseenEvents,
  onView,
  onDismiss,
}) {
  if (unseenEvents.length === 0) {
    return null;
  }

  const titles = unseenEvents.map((event) => getEventTitle(event)).join(", ");

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-800 dark:bg-emerald-950/40">
      <div className="flex gap-3">
        <Bell className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
            Nieuwe opstelling{unseenEvents.length > 1 ? "en" : ""} beschikbaar!
          </p>
          <p className="text-sm text-emerald-800 dark:text-emerald-200">
            {titles}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={onView}>
          Bekijk opstelling
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDismiss}>
          <X className="h-4 w-4" />
          <span className="sr-only">Sluiten</span>
        </Button>
      </div>
    </div>
  );
}
