"use client";

import { useState } from "react";

import { CalendarViewToggle } from "@/components/calendar/CalendarViewToggle";
import { MonthView } from "@/components/calendar/MonthView";
import { WeekView } from "@/components/calendar/WeekView";
import { getDefaultMonth } from "@/lib/calendar";

export function CalendarTab({
  events,
  weekViewProps,
  onWeekChange,
  isLoading = false,
}) {
  const [calendarView, setCalendarView] = useState("week");
  const [monthYear, setMonthYear] = useState(() => getDefaultMonth());

  function handleDaySelect(date) {
    onWeekChange(date);
    setCalendarView("week");
  }

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="rounded-xl border border-dashed bg-card p-10 text-center">
          <p className="text-sm font-medium text-foreground">Kalender laden…</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Even geduld, de huidige week wordt voorbereid.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <CalendarViewToggle value={calendarView} onChange={setCalendarView} />

      {calendarView === "week" ? (
        <WeekView {...weekViewProps} />
      ) : (
        <MonthView
          events={events}
          monthYear={monthYear}
          onMonthChange={setMonthYear}
          onDaySelect={handleDaySelect}
        />
      )}
    </section>
  );
}
