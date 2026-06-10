"use client";

import { useState } from "react";

import { AdminOverview } from "@/components/admin/AdminOverview";
import { WeekView } from "@/components/calendar/WeekView";
import { Header } from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EVENTS,
  getDefaultWeekStart,
  getEventsForWeek,
  getPlayerById,
  getResponseKey,
  getWeekStart,
} from "@/lib/mock-data";

export function SquadPlanner() {
  const [currentPlayerId, setCurrentPlayerId] = useState("senne");
  const [responses, setResponses] = useState({});
  const [weekStart, setWeekStart] = useState(() => getDefaultWeekStart(EVENTS));

  const currentPlayer = getPlayerById(currentPlayerId);
  const weekEvents = getEventsForWeek(EVENTS, weekStart);

  function handleWeekChange(date) {
    setWeekStart(getWeekStart(date));
  }

  function handleAvailabilityChange(eventId, status) {
    const responseKey = getResponseKey(currentPlayerId, eventId);

    setResponses((previous) => ({
      ...previous,
      [responseKey]: status,
    }));
  }

  const weekViewProps = {
    events: weekEvents,
    weekStart,
    onWeekChange: handleWeekChange,
    currentPlayerId,
    responses,
    onAvailabilityChange: handleAvailabilityChange,
  };

  return (
    <div className="min-h-full bg-muted/30">
      <Header
        currentPlayer={currentPlayer}
        onPlayerChange={setCurrentPlayerId}
      />

      <main className="mx-auto max-w-3xl px-4 py-8">
        {currentPlayer.isAdmin ? (
          <Tabs defaultValue="player">
            <TabsList>
              <TabsTrigger value="player">Mijn antwoorden</TabsTrigger>
              <TabsTrigger value="admin">Admin-overzicht</TabsTrigger>
            </TabsList>

            <TabsContent value="player">
              <WeekView {...weekViewProps} />
            </TabsContent>

            <TabsContent value="admin">
              <AdminOverview
                events={weekEvents}
                weekStart={weekStart}
                onWeekChange={handleWeekChange}
                responses={responses}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <WeekView {...weekViewProps} />
        )}
      </main>
    </div>
  );
}
