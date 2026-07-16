"use client";

import { useState } from "react";

import { CalendarViewToggle } from "@/components/calendar/CalendarViewToggle";
import { MonthView } from "@/components/calendar/MonthView";
import { WeekView } from "@/components/calendar/WeekView";
import { getDefaultMonth } from "@/lib/calendar";

export function CalendarTab({ events, weekViewProps, onWeekChange }) {
  const [calendarView, setCalendarView] = useState("week");
  const [monthYear, setMonthYear] = useState(() => getDefaultMonth());

  function handleDaySelect(date) {
    onWeekChange(date);
    setCalendarView("week");
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
