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
  getEventAttendance,
  saveEventAttendance as saveEventAttendanceAction,
} from "@/app/actions/attendance";
import { getMatchStats } from "@/app/actions/match-stats";
import { getEvents } from "@/app/actions/events";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { EventsManager } from "@/components/admin/EventsManager";
import { PlayersManager } from "@/components/admin/PlayersManager";
import { CalendarTab } from "@/components/calendar/CalendarTab";
import { Header } from "@/components/layout/Header";
import { OneSignalInit } from "@/components/notifications/OneSignalInit";
import { PushOptIn } from "@/components/notifications/PushOptIn";
import { LineupManager } from "@/components/lineup/LineupManager";
import { LineupNotificationBanner } from "@/components/lineup/LineupNotificationBanner";
import { LineupTab } from "@/components/lineup/LineupTab";
import { TeamOverview } from "@/components/stats/TeamOverview";
import { StatsManager } from "@/components/stats/StatsManager";
import { StatsTab } from "@/components/stats/StatsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayersProvider } from "@/context/PlayersContext";
import { getPlayers } from "@/app/actions/players";
import {
  getDefaultWeekStart,
  getEventsForWeek,
  getWeekStart,
  parseDate,
  toDateString,
} from "@/lib/events";
import { DemoBanner } from "@/components/demo/DemoBanner";
import { DEMO_READ_ONLY_MESSAGE, getDemoSnapshot } from "@/lib/demo-data";
import { getResponseKey } from "@/lib/mock-data";
import { isStaffViewOnlyPlayer } from "@/lib/players";
import { getPublishedLineup, getUnseenPublishedLineups } from "@/lib/lineups";
import { getAvailableSeasonIds, getCurrentSeasonId } from "@/lib/seasons";
import {
  readStoredSeenLineups,
  writeStoredSeenLineups,
} from "@/lib/seen-lineups";

const ADMIN_TABS = [
  "admin",
  "players-admin",
  "events-admin",
  "lineup-admin",
  "stats-admin",
];
const PLAYER_TABS = ["lineup", "stats"];

function getRoleViewStorageKey(playerId) {
  return `squad-planner-role-view-${playerId}`;
}

function readStoredRoleView(playerId) {
  if (typeof window === "undefined") {
    return "player";
  }

  const stored = window.localStorage.getItem(getRoleViewStorageKey(playerId));
  return stored === "admin" ? "admin" : "player";
}

function sameWeek(a, b) {
  return toDateString(getWeekStart(a)) === toDateString(getWeekStart(b));
}

function getInitialWeekStart(isDemo) {
  if (isDemo) {
    return getDefaultWeekStart(getDemoSnapshot().events);
  }
  return getWeekStart(new Date());
}

export function SquadPlanner({ currentPlayer, isDemo = false }) {
  const currentPlayerId = currentPlayer.id;
  const [players, setPlayers] = useState([]);
  const [events, setEvents] = useState([]);
  const [responses, setResponses] = useState({});
  const [lineups, setLineups] = useState({});
  const [matchStats, setMatchStats] = useState({});
  const [attendance, setAttendance] = useState({});
  const [seenLineups, setSeenLineups] = useState(() =>
    readStoredSeenLineups(currentPlayer.id)
  );
  const [weekStart, setWeekStart] = useState(() => getInitialWeekStart(isDemo));
  const [activeTab, setActiveTab] = useState("calendar");
  const [roleView, setRoleView] = useState(() =>
    readStoredRoleView(currentPlayer.id)
  );
  const [dataLoading, setDataLoading] = useState(!isDemo);
  const [saveError, setSaveError] = useState(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState(() =>
    getCurrentSeasonId()
  );

  const availableSeasonIds = useMemo(
    () => getAvailableSeasonIds({ events }),
    [events]
  );

  useEffect(() => {
    if (
      availableSeasonIds.length > 0 &&
      !availableSeasonIds.includes(selectedSeasonId)
    ) {
      setSelectedSeasonId(getCurrentSeasonId());
    }
  }, [availableSeasonIds, selectedSeasonId]);

  const weekEvents = getEventsForWeek(events, weekStart);
  const isAdmin = currentPlayer.isAdmin ?? false;
  const isSquadPlayer = currentPlayer.isSquadPlayer ?? false;
  const isStaffViewOnly =
    currentPlayer.isStaffViewOnly ?? isStaffViewOnlyPlayer(currentPlayer);
  const canSwitchRole = isAdmin && isSquadPlayer;
  const showAdminTabs =
    isAdmin && !isStaffViewOnly && (!canSwitchRole || roleView === "admin");
  const showPlayerTabs =
    isSquadPlayer && (!canSwitchRole || roleView === "player");
  const showTeamTab = showPlayerTabs || showAdminTabs || isStaffViewOnly;

  const unseenLineupEvents = useMemo(
    () =>
      showPlayerTabs ? getUnseenPublishedLineups(events, lineups, seenLineups) : [],
    [events, lineups, seenLineups, showPlayerTabs]
  );

  useEffect(() => {
    if (isDemo) {
      const snapshot = getDemoSnapshot();
      setPlayers(snapshot.players);
      setEvents(snapshot.events);
      setResponses(snapshot.responses);
      setLineups(snapshot.lineups);
      setMatchStats(snapshot.matchStats);
      setAttendance(snapshot.attendance);
      setWeekStart((previous) => {
        const next = getDefaultWeekStart(snapshot.events);
        return sameWeek(previous, next) ? previous : next;
      });
      setDataLoading(false);
      setSaveError(null);
      return;
    }

    let cancelled = false;

    async function loadPersistedData() {
      setDataLoading(true);

      const [
        playersResult,
        eventsResult,
        availabilityResult,
        lineupsResult,
        matchStatsResult,
        attendanceResult,
      ] = await Promise.all([
        getPlayers(),
        getEvents(),
        getAvailabilityResponses(),
        getLineups(),
        getMatchStats(),
        getEventAttendance(),
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
        setWeekStart((previous) => {
          const next = getDefaultWeekStart(eventsResult.events);
          return sameWeek(previous, next) ? previous : next;
        });
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

      if (attendanceResult.success) {
        setAttendance(attendanceResult.attendance);
      } else {
        errors.push(attendanceResult.error);
      }

      setSaveError(errors.length > 0 ? errors.join(" · ") : null);
      setDataLoading(false);
    }

    loadPersistedData();

    return () => {
      cancelled = true;
    };
  }, [isDemo]);

  useEffect(() => {
    setRoleView(readStoredRoleView(currentPlayer.id));
    setSeenLineups(readStoredSeenLineups(currentPlayer.id));
  }, [currentPlayer.id]);

  useEffect(() => {
    if (!canSwitchRole) {
      return;
    }

    window.localStorage.setItem(getRoleViewStorageKey(currentPlayer.id), roleView);
  }, [canSwitchRole, currentPlayer.id, roleView]);

  useEffect(() => {
    const playerOnlyTabs = ["lineup", "stats"];
    if (!showPlayerTabs && playerOnlyTabs.includes(activeTab)) {
      setActiveTab("calendar");
    }
  }, [currentPlayer.id, showPlayerTabs, activeTab]);

  useEffect(() => {
    if (!showAdminTabs && ADMIN_TABS.includes(activeTab)) {
      setActiveTab("calendar");
    }
  }, [showAdminTabs, activeTab]);

  function handleRoleViewChange(nextRoleView) {
    setRoleView(nextRoleView);

    if (nextRoleView === "player" && ADMIN_TABS.includes(activeTab)) {
      setActiveTab("calendar");
    }

    if (nextRoleView === "admin" && PLAYER_TABS.includes(activeTab)) {
      setActiveTab("calendar");
    }
  }

  function handleWeekChange(date) {
    setWeekStart(getWeekStart(date));
  }

  async function handleAvailabilityChange(eventId, status) {
    if (isDemo) {
      setSaveError(DEMO_READ_ONLY_MESSAGE);
      return;
    }

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

  const markLineupSeen = useCallback(
    (eventId) => {
      const lineup = getPublishedLineup(lineups, eventId);

      if (!lineup?.publishedAt) {
        return;
      }

      setSeenLineups((previous) => {
        if (previous[eventId] === lineup.publishedAt) {
          return previous;
        }

        const next = {
          ...previous,
          [eventId]: lineup.publishedAt,
        };
        writeStoredSeenLineups(currentPlayerId, next);
        return next;
      });
    },
    [currentPlayerId, lineups]
  );

  async function handleSaveLineup(eventId, lineupData) {
    if (isDemo) {
      setSaveError(DEMO_READ_ONLY_MESSAGE);
      return;
    }

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
    if (isDemo) {
      setSaveError(DEMO_READ_ONLY_MESSAGE);
      return;
    }

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
        writeStoredSeenLineups(currentPlayerId, next);
        return next;
      });
    }
  }

  async function handleUnpublishLineup(eventId) {
    if (isDemo) {
      setSaveError(DEMO_READ_ONLY_MESSAGE);
      return;
    }

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

  async function handleSaveAttendance({
    eventId,
    eventType,
    draft,
    statsPayload = {},
  }) {
    if (isDemo) {
      setSaveError(DEMO_READ_ONLY_MESSAGE);
      return;
    }

    const previousAttendance = attendance[eventId];
    const previousStats = matchStats[eventId];
    const nextEventAttendance = Object.fromEntries(
      Object.entries(draft ?? {}).map(([playerId, entry]) => [
        playerId,
        {
          attended: Boolean(entry?.attended),
          minutes: entry?.minutes ?? null,
        },
      ])
    );

    setAttendance((previous) => ({
      ...previous,
      [eventId]: nextEventAttendance,
    }));

    if (eventType === "match") {
      setMatchStats((previous) => ({
        ...previous,
        [eventId]: statsPayload,
      }));
    }

    setSaveError(null);

    const result = await saveEventAttendanceAction({
      eventId,
      eventType,
      draft,
      statsPayload,
    });

    if (!result.success) {
      setAttendance((previous) => {
        const next = { ...previous };

        if (previousAttendance === undefined) {
          delete next[eventId];
        } else {
          next[eventId] = previousAttendance;
        }

        return next;
      });

      if (eventType === "match") {
        setMatchStats((previous) => {
          const next = { ...previous };

          if (previousStats === undefined) {
            delete next[eventId];
          } else {
            next[eventId] = previousStats;
          }

          return next;
        });
      }

      setSaveError(result.error);
    }
  }

  function handleDismissNotifications() {
    unseenLineupEvents.forEach((event) => markLineupSeen(event.id));
  }

  function handleViewLineupNotification() {
    const firstUnseen = unseenLineupEvents[0];

    if (firstUnseen) {
      setWeekStart(getWeekStart(parseDate(firstUnseen.date)));
      markLineupSeen(firstUnseen.id);
    }

    if (canSwitchRole) {
      setRoleView("player");
    }

    setActiveTab("lineup");
  }

  const weekViewProps = {
    events,
    weekStart,
    onWeekChange: handleWeekChange,
    currentPlayerId,
    responses,
    onAvailabilityChange: handleAvailabilityChange,
    availabilityDisabled: dataLoading,
  };

  const lineupTabProps = {
    events,
    lineups,
    currentPlayerId,
    onLineupViewed: markLineupSeen,
  };

  const seasonStatsProps = {
    seasonId: selectedSeasonId,
    availableSeasonIds,
    onSeasonChange: setSelectedSeasonId,
  };

  return (
    <PlayersProvider players={players}>
      <div className="min-h-full bg-muted/30">
        <Header
          currentPlayer={currentPlayer}
          showRoleSwitch={canSwitchRole}
          roleView={roleView}
          onRoleViewChange={handleRoleViewChange}
          isDemo={isDemo}
        />

        <main className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        {isDemo && <DemoBanner />}

        {saveError && (
          <div
            role="alert"
            className={`rounded-lg border px-4 py-3 text-sm ${
              isDemo
                ? "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
            }`}
          >
            {saveError}
          </div>
        )}

        {dataLoading && (
          <p className="text-sm text-muted-foreground">Gegevens laden...</p>
        )}

        {showPlayerTabs && !dataLoading && (
          <LineupNotificationBanner
            unseenEvents={unseenLineupEvents}
            onView={handleViewLineupNotification}
            onDismiss={handleDismissNotifications}
          />
        )}

        {!isDemo && isSquadPlayer && process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID && (
          <>
            <OneSignalInit playerId={currentPlayerId} />
            <PushOptIn currentPlayer={currentPlayer} />
          </>
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

            {showTeamTab && <TabsTrigger value="team">Team</TabsTrigger>}

            {showPlayerTabs && (
              <TabsTrigger value="stats">Mijn seizoen</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="calendar">
            <CalendarTab
              events={events}
              weekViewProps={weekViewProps}
              onWeekChange={handleWeekChange}
              isLoading={dataLoading}
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
                attendance={attendance}
                events={events}
                {...seasonStatsProps}
              />
            </TabsContent>
          )}

          {showTeamTab && (
            <TabsContent value="team">
              <TeamOverview
                events={events}
                attendance={attendance}
                matchStats={matchStats}
                {...seasonStatsProps}
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
                <PlayersManager
                  players={players}
                  onPlayersChange={setPlayers}
                  readOnly={isDemo}
                />
              </TabsContent>

              <TabsContent value="events-admin">
                <EventsManager
                  events={events}
                  onEventsChange={setEvents}
                  weekStart={weekStart}
                  onWeekChange={handleWeekChange}
                  readOnly={isDemo}
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
                  attendance={attendance}
                  matchStats={matchStats}
                  onSaveAttendance={handleSaveAttendance}
                  readOnly={isDemo}
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
