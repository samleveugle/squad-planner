"use client";

import { useState } from "react";

import { CalendarViewToggle } from "@/components/calendar/CalendarViewToggle";
import { MonthView } from "@/components/calendar/MonthView";
import { WeekView } from "@/components/calendar/WeekView";
import { getDefaultMonth } from "@/lib/calendar";
import { EVENTS } from "@/lib/mock-data";

export function CalendarTab({ weekViewProps, onWeekChange }) {
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
          events={EVENTS}
          monthYear={monthYear}
          onMonthChange={setMonthYear}
          onDaySelect={handleDaySelect}
        />
      )}
    </section>
  );
}
