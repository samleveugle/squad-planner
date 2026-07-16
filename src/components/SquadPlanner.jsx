"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getAvailabilityResponses,
  saveAvailability,
} from "@/app/actions/availability";
import {
  getLineups,
  publishLineup as publishLineupAction,
  saveLineup as saveLineupAction,
  unpublishLineup as unpublishLineupAction,
} from "@/app/actions/lineups";
import {
  getMatchStats,
  saveMatchStats as saveMatchStatsAction,
} from "@/app/actions/match-stats";
import { getEvents } from "@/app/actions/events";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { EventsManager } from "@/components/admin/EventsManager";
import { PlayersManager } from "@/components/admin/PlayersManager";
import { CalendarTab } from "@/components/calendar/CalendarTab";
import { Header } from "@/components/layout/Header";
import { LineupManager } from "@/components/lineup/LineupManager";
import { LineupNotificationBanner } from "@/components/lineup/LineupNotificationBanner";
import { LineupTab } from "@/components/lineup/LineupTab";
import { StatsManager } from "@/components/stats/StatsManager";
import { StatsTab } from "@/components/stats/StatsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayersProvider } from "@/context/PlayersContext";
import { getPlayers } from "@/app/actions/players";
import {
  getDefaultWeekStart,
  getEventsForWeek,
  getWeekStart,
} from "@/lib/events";
import { getResponseKey } from "@/lib/mock-data";
import { getUnseenPublishedLineups } from "@/lib/lineups";

export function SquadPlanner({ currentPlayer }) {
  const currentPlayerId = currentPlayer.id;
  const [players, setPlayers] = useState([]);
  const [events, setEvents] = useState([]);
  const [responses, setResponses] = useState({});
  const [lineups, setLineups] = useState({});
  const [matchStats, setMatchStats] = useState({});
  const [seenLineups, setSeenLineups] = useState({});
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [activeTab, setActiveTab] = useState("calendar");
  const [dataLoading, setDataLoading] = useState(true);
  const [saveError, setSaveError] = useState(null);

  const weekEvents = getEventsForWeek(events, weekStart);
  const showPlayerTabs = currentPlayer.isSquadPlayer ?? false;
  const showAdminTabs = currentPlayer.isAdmin ?? false;

  const unseenLineupEvents = useMemo(
    () =>
      showPlayerTabs ? getUnseenPublishedLineups(events, lineups, seenLineups) : [],
    [events, lineups, seenLineups, showPlayerTabs]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadPersistedData() {
      setDataLoading(true);

      const [playersResult, eventsResult, availabilityResult, lineupsResult, matchStatsResult] =
        await Promise.all([
          getPlayers(),
          getEvents(),
          getAvailabilityResponses(),
          getLineups(),
          getMatchStats(),
        ]);

      if (cancelled) {
        return;
      }

      const errors = [];

      if (playersResult.success) {
        setPlayers(playersResult.players);
      } else {
        errors.push(playersResult.error);
      }

      if (eventsResult.success) {
        setEvents(eventsResult.events);
        setWeekStart(getDefaultWeekStart(eventsResult.events));
      } else {
        errors.push(eventsResult.error);
      }

      if (availabilityResult.success) {
        setResponses(availabilityResult.responses);
      } else {
        errors.push(availabilityResult.error);
      }

      if (lineupsResult.success) {
        setLineups(lineupsResult.lineups);
      } else {
        errors.push(lineupsResult.error);
      }

      if (matchStatsResult.success) {
        setMatchStats(matchStatsResult.matchStats);
      } else {
        errors.push(matchStatsResult.error);
      }

      setSaveError(errors.length > 0 ? errors.join(" · ") : null);
      setDataLoading(false);
    }

    loadPersistedData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const playerOnlyTabs = ["lineup", "stats"];
    if (!showPlayerTabs && playerOnlyTabs.includes(activeTab)) {
      setActiveTab("calendar");
    }
  }, [currentPlayer.id, showPlayerTabs, activeTab]);

  function handleWeekChange(date) {
    setWeekStart(getWeekStart(date));
  }

  async function handleAvailabilityChange(eventId, status) {
    const responseKey = getResponseKey(currentPlayerId, eventId);
    const previousStatus = responses[responseKey];

    setResponses((previous) => ({
      ...previous,
      [responseKey]: status,
    }));
    setSaveError(null);

    const result = await saveAvailability(eventId, status);

    if (!result.success) {
      setResponses((previous) => {
        const next = { ...previous };

        if (previousStatus === undefined) {
          delete next[responseKey];
        } else {
          next[responseKey] = previousStatus;
        }

        return next;
      });
      setSaveError(result.error);
    }
  }

  const markLineupSeen = useCallback((eventId) => {
    setSeenLineups((previous) => ({
      ...previous,
      [eventId]: true,
    }));
  }, []);

  async function handleSaveLineup(eventId, lineupData) {
    const previousLineup = lineups[eventId];
    const nextLineup = {
      ...lineupData,
      published: previousLineup?.published ?? false,
      publishedAt: previousLineup?.publishedAt ?? null,
    };

    setLineups((previous) => ({
      ...previous,
      [eventId]: nextLineup,
    }));
    setSaveError(null);

    const result = await saveLineupAction(eventId, nextLineup);

    if (!result.success) {
      setLineups((previous) => {
        const next = { ...previous };

        if (previousLineup === undefined) {
          delete next[eventId];
        } else {
          next[eventId] = previousLineup;
        }

        return next;
      });
      setSaveError(result.error);
    }
  }

  async function handlePublishLineup(eventId, lineupData) {
    const previousLineup = lineups[eventId];
    const publishedAt = new Date().toISOString();
    const nextLineup = {
      ...lineupData,
      published: true,
      publishedAt,
    };

    setLineups((previous) => ({
      ...previous,
      [eventId]: nextLineup,
    }));
    setSaveError(null);

    const result = await publishLineupAction(eventId, lineupData);

    if (!result.success) {
      setLineups((previous) => {
        const next = { ...previous };

        if (previousLineup === undefined) {
          delete next[eventId];
        } else {
          next[eventId] = previousLineup;
        }

        return next;
      });
      setSaveError(result.error);
    } else {
      setSeenLineups((previous) => {
        const next = { ...previous };
        delete next[eventId];
        return next;
      });
    }
  }

  async function handleUnpublishLineup(eventId) {
    const previousLineup = lineups[eventId];

    if (!previousLineup) {
      return;
    }

    setLineups((previous) => ({
      ...previous,
      [eventId]: {
        ...previousLineup,
        published: false,
      },
    }));
    setSaveError(null);

    const result = await unpublishLineupAction(eventId);

    if (!result.success) {
      setLineups((previous) => ({
        ...previous,
        [eventId]: previousLineup,
      }));
      setSaveError(result.error);
    }
  }

  async function handleSaveMatchStats(eventId, statsPayload) {
    const previousStats = matchStats[eventId];

    setMatchStats((previous) => ({
      ...previous,
      [eventId]: statsPayload,
    }));
    setSaveError(null);

    const result = await saveMatchStatsAction(eventId, statsPayload);

    if (!result.success) {
      setMatchStats((previous) => {
        const next = { ...previous };

        if (previousStats === undefined) {
          delete next[eventId];
        } else {
          next[eventId] = previousStats;
        }

        return next;
      });
      setSaveError(result.error);
    }
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
    availabilityDisabled: dataLoading,
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
    <PlayersProvider players={players}>
      <div className="min-h-full bg-muted/30">
        <Header currentPlayer={currentPlayer} />

        <main className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        {saveError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
          >
            {saveError}
          </div>
        )}

        {dataLoading && (
          <p className="text-sm text-muted-foreground">Gegevens laden...</p>
        )}

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
                <TabsTrigger value="players-admin">Spelers</TabsTrigger>
                <TabsTrigger value="events-admin">Agenda</TabsTrigger>
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
            <CalendarTab
              events={events}
              weekViewProps={weekViewProps}
              onWeekChange={handleWeekChange}
            />
          </TabsContent>

          {showPlayerTabs && (
            <TabsContent value="lineup">
              <LineupTab {...lineupTabProps} />
            </TabsContent>
          )}

          {showPlayerTabs && (
            <TabsContent value="stats">
              <StatsTab
                currentPlayer={currentPlayer}
                matchStats={matchStats}
                events={events}
              />
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

              <TabsContent value="players-admin">
                <PlayersManager players={players} onPlayersChange={setPlayers} />
              </TabsContent>

              <TabsContent value="events-admin">
                <EventsManager
                  events={events}
                  onEventsChange={setEvents}
                  weekStart={weekStart}
                  onWeekChange={handleWeekChange}
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
    </PlayersProvider>
  );
}
