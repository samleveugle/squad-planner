import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { addWeeks, formatWeekRange, getWeekStart } from "@/lib/mock-data";

export function WeekNavigator({ weekStart, onWeekChange }) {
  function goToPreviousWeek() {
    onWeekChange(addWeeks(weekStart, -1));
  }

  function goToNextWeek() {
    onWeekChange(addWeeks(weekStart, 1));
  }

  function goToCurrentWeek() {
    onWeekChange(getWeekStart(new Date()));
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold">Week {formatWeekRange(weekStart)}</h2>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={goToPreviousWeek}
          aria-label="Vorige week"
        >
          <ChevronLeft />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={goToCurrentWeek}>
          Vandaag
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={goToNextWeek}
          aria-label="Volgende week"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
