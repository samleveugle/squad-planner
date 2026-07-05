import { ChevronLeft, ChevronRight } from "lucide-react";

import { MonthDayCell } from "@/components/calendar/MonthDayCell";
import { Button } from "@/components/ui/button";
import {
  addMonths,
  formatMonthYear,
  getDefaultMonth,
  getEventsForDate,
  getMonthGrid,
  isMonthInSeason,
  WEEKDAY_LABELS,
} from "@/lib/calendar";
import { getWeekStart } from "@/lib/mock-data";

export function MonthView({
  events,
  monthYear,
  onMonthChange,
  onDaySelect,
}) {
  const { year, month } = monthYear ?? getDefaultMonth();
  const cells = getMonthGrid(year, month);
  const prevMonth = addMonths(year, month, -1);
  const nextMonth = addMonths(year, month, 1);
  const canGoPrev = isMonthInSeason(prevMonth.year, prevMonth.month);
  const canGoNext = isMonthInSeason(nextMonth.year, nextMonth.month);

  function goToPreviousMonth() {
    if (canGoPrev) {
      onMonthChange(addMonths(year, month, -1));
    }
  }

  function goToNextMonth() {
    if (canGoNext) {
      onMonthChange(addMonths(year, month, 1));
    }
  }

  function goToToday() {
    onMonthChange(getDefaultMonth());
  }

  function handleDaySelect(date) {
    onDaySelect(getWeekStart(date));
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold capitalize">{formatMonthYear(year, month)}</h2>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={goToPreviousMonth}
            disabled={!canGoPrev}
            aria-label="Vorige maand"
          >
            <ChevronLeft />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={goToToday}>
            Vandaag
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={goToNextMonth}
            disabled={!canGoNext}
            aria-label="Volgende maand"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="py-1 text-center text-xs font-medium text-muted-foreground"
          >
            {label}
          </div>
        ))}

        {cells.map((cell) => (
          <MonthDayCell
            key={cell.dateString}
            cell={cell}
            events={getEventsForDate(events, cell.dateString)}
            onSelect={handleDaySelect}
          />
        ))}
      </div>
    </section>
  );
}
