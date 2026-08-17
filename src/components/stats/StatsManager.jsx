"use client";

import { useState } from "react";

import { WeekNavigator } from "@/components/calendar/WeekNavigator";
import { AttendanceEventForm } from "@/components/stats/AttendanceEventForm";
import { EventTypeToggle } from "@/components/stats/EventTypeToggle";
import { EventTitleBlock } from "@/components/events/EventTitleBlock";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { DEMO_READ_ONLY_MESSAGE } from "@/lib/demo-data";
import {
  formatEventDate,
  formatEventTime,
} from "@/lib/events";

export function StatsManager({
  events,
  weekStart,
  onWeekChange,
  attendance,
  matchStats,
  onSaveAttendance,
  readOnly = false,
}) {
  const [eventType, setEventType] = useState("training");
  const filteredEvents = events.filter((event) => event.type === eventType);
  const emptyLabel =
    eventType === "training"
      ? "Geen trainingen deze week"
      : "Geen wedstrijden deze week";

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Stats invoeren</h2>

      {readOnly && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          {DEMO_READ_ONLY_MESSAGE}
        </p>
      )}

      <EventTypeToggle value={eventType} onChange={setEventType} />

      <WeekNavigator weekStart={weekStart} onWeekChange={onWeekChange} />

      {filteredEvents.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-8 text-center">
          <p className="font-medium">{emptyLabel}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <Card key={event.id}>
              <CardHeader className="pb-3">
                <EventTitleBlock event={event} />
                <CardDescription>
                  {formatEventDate(event.date)} · {formatEventTime(event)} ·{" "}
                  {event.location}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AttendanceEventForm
                  event={event}
                  attendance={attendance}
                  matchStats={matchStats}
                  onSave={onSaveAttendance}
                  readOnly={readOnly}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
