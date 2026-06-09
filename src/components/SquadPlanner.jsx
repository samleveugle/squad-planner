"use client";

import { useState } from "react";

import { AdminOverview } from "@/components/admin/AdminOverview";
import { WeekView } from "@/components/calendar/WeekView";
import { Header } from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EVENTS,
  getPlayerById,
  getResponseKey,
  PLAYERS,
} from "@/lib/mock-data";

export function SquadPlanner() {
  const [currentPlayerId, setCurrentPlayerId] = useState(PLAYERS[0].id);
  const [responses, setResponses] = useState({});

  const currentPlayer = getPlayerById(currentPlayerId);

  function handleAvailabilityChange(eventId, status) {
    const responseKey = getResponseKey(currentPlayerId, eventId);

    setResponses((previous) => ({
      ...previous,
      [responseKey]: status,
    }));
  }

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
              <WeekView
                events={EVENTS}
                currentPlayerId={currentPlayerId}
                responses={responses}
                onAvailabilityChange={handleAvailabilityChange}
              />
            </TabsContent>

            <TabsContent value="admin">
              <AdminOverview responses={responses} />
            </TabsContent>
          </Tabs>
        ) : (
          <WeekView
            events={EVENTS}
            currentPlayerId={currentPlayerId}
            responses={responses}
            onAvailabilityChange={handleAvailabilityChange}
          />
        )}
      </main>
    </div>
  );
}
