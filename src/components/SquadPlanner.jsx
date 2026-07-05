"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminOverview } from "@/components/admin/AdminOverview";
import { WeekView } from "@/components/calendar/WeekView";
import { Header } from "@/components/layout/Header";
import { LineupManager } from "@/components/lineup/LineupManager";
import { LineupNotificationBanner } from "@/components/lineup/LineupNotificationBanner";
import { LineupTab } from "@/components/lineup/LineupTab";
import { StatsManager } from "@/components/stats/StatsManager";
import { StatsTab } from "@/components/stats/StatsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EVENTS,
  getDefaultWeekStart,
  getEventsForWeek,
  getPlayerById,
  getResponseKey,
  getWeekStart,
} from "@/lib/mock-data";
import { getUnseenPublishedLineups } from "@/lib/lineups";

export function SquadPlanner() {
  const [currentPlayerId, setCurrentPlayerId] = useState("senne");
  const [responses, setResponses] = useState({});
  const [lineups, setLineups] = useState({});
  const [matchStats, setMatchStats] = useState({});
  const [seenLineups, setSeenLineups] = useState({});
  const [weekStart, setWeekStart] = useState(() => getDefaultWeekStart(EVENTS));
  const [activeTab, setActiveTab] = useState("calendar");

  const currentPlayer = getPlayerById(currentPlayerId);
  const weekEvents = getEventsForWeek(EVENTS, weekStart);
  const showPlayerTabs = currentPlayer?.isSquadPlayer ?? false;
  const showAdminTabs = currentPlayer?.isAdmin ?? false;

  const unseenLineupEvents = useMemo(
    () =>
      showPlayerTabs ? getUnseenPublishedLineups(EVENTS, lineups, seenLineups) : [],
    [lineups, seenLineups, showPlayerTabs]
  );

  useEffect(() => {
    const playerOnlyTabs = ["lineup", "stats"];
    if (!showPlayerTabs && playerOnlyTabs.includes(activeTab)) {
      setActiveTab("calendar");
    }
  }, [currentPlayerId, showPlayerTabs, activeTab]);

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

  const markLineupSeen = useCallback((eventId) => {
    setSeenLineups((previous) => ({
      ...previous,
      [eventId]: true,
    }));
  }, []);

  function handleSaveLineup(eventId, lineupData) {
    setLineups((previous) => ({
      ...previous,
      [eventId]: {
        ...lineupData,
        published: previous[eventId]?.published ?? false,
        publishedAt: previous[eventId]?.publishedAt ?? null,
      },
    }));
  }

  function handlePublishLineup(eventId, lineupData) {
    setLineups((previous) => ({
      ...previous,
      [eventId]: {
        ...lineupData,
        published: true,
        publishedAt: new Date().toISOString(),
      },
    }));

    setSeenLineups((previous) => {
      const next = { ...previous };
      delete next[eventId];
      return next;
    });
  }

  function handleUnpublishLineup(eventId) {
    setLineups((previous) => ({
      ...previous,
      [eventId]: {
        ...previous[eventId],
        published: false,
      },
    }));
  }

  function handleSaveMatchStats(eventId, statsPayload) {
    setMatchStats((previous) => ({
      ...previous,
      [eventId]: statsPayload,
    }));
  }

  function handleDismissNotifications() {
    unseenLineupEvents.forEach((event) => markLineupSeen(event.id));
  }

  function handleViewLineupNotification() {
    setActiveTab("lineup");
    unseenLineupEvents.forEach((event) => markLineupSeen(event.id));
  }

  const weekViewProps = {
    events: weekEvents,
    weekStart,
    onWeekChange: handleWeekChange,
    currentPlayerId,
    responses,
    onAvailabilityChange: handleAvailabilityChange,
    lineups,
    onLineupViewed: markLineupSeen,
  };

  const lineupTabProps = {
    events: weekEvents,
    weekStart,
    onWeekChange: handleWeekChange,
    lineups,
    currentPlayerId,
    onLineupViewed: markLineupSeen,
  };

  return (
    <div className="min-h-full bg-muted/30">
      <Header
        currentPlayer={currentPlayer}
        onPlayerChange={setCurrentPlayerId}
      />

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        {showPlayerTabs && (
          <LineupNotificationBanner
            unseenEvents={unseenLineupEvents}
            onView={handleViewLineupNotification}
            onDismiss={handleDismissNotifications}
          />
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex h-auto w-full flex-nowrap justify-start overflow-x-auto">
            <TabsTrigger value="calendar">Kalender</TabsTrigger>

            {showAdminTabs && (
              <>
                <TabsTrigger value="admin">Beschikbaarheid</TabsTrigger>
                <TabsTrigger value="lineup-admin">Opstelling maken</TabsTrigger>
              </>
            )}

            {showPlayerTabs && (
              <TabsTrigger value="lineup" className="relative">
                Opstelling
                {unseenLineupEvents.length > 0 && (
                  <span className="ml-1.5 inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                )}
              </TabsTrigger>
            )}

            {showAdminTabs && (
              <TabsTrigger value="stats-admin">Stats invoeren</TabsTrigger>
            )}

            {showPlayerTabs && <TabsTrigger value="stats">Stats</TabsTrigger>}
          </TabsList>

          <TabsContent value="calendar">
            <WeekView {...weekViewProps} />
          </TabsContent>

          {showPlayerTabs && (
            <TabsContent value="lineup">
              <LineupTab {...lineupTabProps} />
            </TabsContent>
          )}

          {showPlayerTabs && (
            <TabsContent value="stats">
              <StatsTab currentPlayer={currentPlayer} matchStats={matchStats} />
            </TabsContent>
          )}

          {showAdminTabs && (
            <>
              <TabsContent value="admin">
                <AdminOverview
                  events={weekEvents}
                  weekStart={weekStart}
                  onWeekChange={handleWeekChange}
                  responses={responses}
                />
              </TabsContent>

              <TabsContent value="lineup-admin">
                <LineupManager
                  events={weekEvents}
                  weekStart={weekStart}
                  onWeekChange={handleWeekChange}
                  responses={responses}
                  lineups={lineups}
                  onSaveLineup={handleSaveLineup}
                  onPublishLineup={handlePublishLineup}
                  onUnpublishLineup={handleUnpublishLineup}
                />
              </TabsContent>

              <TabsContent value="stats-admin">
                <StatsManager
                  events={weekEvents}
                  weekStart={weekStart}
                  onWeekChange={handleWeekChange}
                  matchStats={matchStats}
                  lineups={lineups}
                  onSaveMatchStats={handleSaveMatchStats}
                />
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>
    </div>
  );
}
