"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlayers } from "@/context/PlayersContext";
import {
  createAttendanceDraft,
  hasRecordedAttendance,
  parseMinutes,
} from "@/lib/attendance";
import { formatEventDate, toDateString } from "@/lib/events";
import { buildStatsPayload, parseStatValue } from "@/lib/stats";

const DEFAULT_MATCH_MINUTES = 90;
const MAX_CARDS = 3;

function createCombinedDraft(attendance, matchStats, eventId, playerIds) {
  const attendanceDraft = createAttendanceDraft(attendance, eventId, playerIds);
  const eventStats = matchStats[eventId] ?? {};

  const draft = {};
  for (const playerId of playerIds) {
    const savedStats = eventStats[playerId];
    const attended = attendanceDraft[playerId]?.attended ?? false;
    const savedMinutes = attendanceDraft[playerId]?.minutes ?? null;
    draft[playerId] = {
      attended,
      minutes: attended ? (savedMinutes ?? DEFAULT_MATCH_MINUTES) : savedMinutes,
      goals: savedStats != null ? savedStats.goals : null,
      assists: savedStats != null ? savedStats.assists : null,
      yellowCards: savedStats != null ? savedStats.yellowCards : null,
      redCards: savedStats != null ? savedStats.redCards : null,
    };
  }
  return draft;
}

function getInitialStatsOpenByPlayer(matchStats, eventId, playerIds) {
  const eventStats = matchStats[eventId] ?? {};

  return new Set(
    playerIds.filter((playerId) => {
      const stats = eventStats[playerId];
      return stats && ((stats.goals ?? 0) > 0 || (stats.assists ?? 0) > 0);
    })
  );
}

function getInitialCardsOpenByPlayer(matchStats, eventId, playerIds) {
  const eventStats = matchStats[eventId] ?? {};

  return new Set(
    playerIds.filter((playerId) => {
      const stats = eventStats[playerId];
      return stats && ((stats.yellowCards ?? 0) > 0 || (stats.redCards ?? 0) > 0);
    })
  );
}

function selectInputValue(inputEvent) {
  inputEvent.target.select();
}

function StatNumberInput({
  label,
  value,
  disabled,
  min = 0,
  max,
  placeholder,
  onChange,
  onFocus,
}) {
  return (
    <div className="w-28 shrink-0">
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <Input
        type="number"
        min={min}
        max={max}
        inputMode="numeric"
        className="h-9 w-28"
        disabled={disabled}
        placeholder={placeholder}
        value={value ?? ""}
        onFocus={onFocus}
        onChange={onChange}
      />
    </div>
  );
}

export function AttendanceEventForm({
  event,
  attendance,
  matchStats,
  onSave,
  readOnly = false,
}) {
  const { players } = usePlayers();
  const squadPlayers = useMemo(
    () =>
      players
        .filter((player) => player.isSquadPlayer)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [players]
  );
  const squadPlayerIds = useMemo(
    () => squadPlayers.map((player) => player.id),
    [squadPlayers]
  );

  const [draft, setDraft] = useState(() =>
    createCombinedDraft(attendance, matchStats, event.id, squadPlayerIds)
  );
  const [statsOpenByPlayer, setStatsOpenByPlayer] = useState(() =>
    getInitialStatsOpenByPlayer(matchStats, event.id, squadPlayerIds)
  );
  const [cardsOpenByPlayer, setCardsOpenByPlayer] = useState(() =>
    getInitialCardsOpenByPlayer(matchStats, event.id, squadPlayerIds)
  );
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [hasSavedLocally, setHasSavedLocally] = useState(false);

  const today = toDateString(new Date());
  const canEditByDate = event.date <= today;
  const recorded = hasRecordedAttendance(attendance, event.id);
  const isFormLocked =
    readOnly ||
    !canEditByDate ||
    ((recorded || hasSavedLocally) && !isEditing);

  const attendedCount = useMemo(
    () => Object.values(draft).filter((entry) => entry.attended).length,
    [draft]
  );

  useEffect(() => {
    setDraft(
      createCombinedDraft(attendance, matchStats, event.id, squadPlayerIds)
    );
    setStatsOpenByPlayer(
      getInitialStatsOpenByPlayer(matchStats, event.id, squadPlayerIds)
    );
    setCardsOpenByPlayer(
      getInitialCardsOpenByPlayer(matchStats, event.id, squadPlayerIds)
    );
    setIsEditing(false);
    setHasSavedLocally(false);
  }, [attendance, matchStats, event.id, squadPlayerIds]);

  function openPlayerStats(playerId) {
    setStatsOpenByPlayer((current) => new Set(current).add(playerId));
  }

  function closePlayerStats(playerId) {
    setStatsOpenByPlayer((current) => {
      const next = new Set(current);
      next.delete(playerId);
      return next;
    });
  }

  function openPlayerCards(playerId) {
    setCardsOpenByPlayer((current) => new Set(current).add(playerId));
  }

  function closePlayerCards(playerId) {
    setCardsOpenByPlayer((current) => {
      const next = new Set(current);
      next.delete(playerId);
      return next;
    });
  }

  function updatePlayer(playerId, patch) {
    setDraft((current) => ({
      ...current,
      [playerId]: {
        ...current[playerId],
        ...patch,
      },
    }));
    setMessage("");
  }

  function handleSave() {
    if (isFormLocked) {
      return;
    }

    const attendanceDraft = {};
    const statsDraft = {};

    for (const [playerId, entry] of Object.entries(draft)) {
      const attended = Boolean(entry.attended);
      let minutes = null;

      if (attended && event.type === "match") {
        minutes = parseMinutes(entry.minutes) ?? DEFAULT_MATCH_MINUTES;
      }

      attendanceDraft[playerId] = { attended, minutes };

      if (event.type === "match" && attended) {
        statsDraft[playerId] = {
          goals: parseStatValue(entry.goals ?? 0),
          assists: parseStatValue(entry.assists ?? 0),
          yellowCards: parseStatValue(entry.yellowCards ?? 0),
          redCards: parseStatValue(entry.redCards ?? 0),
        };
      }
    }

    onSave({
      eventId: event.id,
      eventType: event.type,
      draft: attendanceDraft,
      statsPayload: event.type === "match" ? buildStatsPayload(statsDraft) : {},
    });
    setIsEditing(false);
    setHasSavedLocally(true);
    setMessage("Opgeslagen.");
  }

  if (squadPlayers.length === 0) {
    return (
      <p className="rounded-md border border-dashed bg-background p-4 text-sm text-muted-foreground">
        Geen squad-spelers om in te vullen.
      </p>
    );
  }

  const isMatch = event.type === "match";

  return (
    <div className="space-y-4">
      {!canEditByDate && (
        <p className="rounded-md border border-dashed bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Invullen mogelijk vanaf {formatEventDate(event.date)}.
        </p>
      )}

      <div className="space-y-3">
        {squadPlayers.map((player) => {
          const entry = draft[player.id] ?? {
            attended: false,
            minutes: null,
            goals: null,
            assists: null,
            yellowCards: null,
            redCards: null,
          };
          const statsOpen = statsOpenByPlayer.has(player.id);
          const cardsOpen = cardsOpenByPlayer.has(player.id);

          return (
            <div key={player.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-3">
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    className="size-4 shrink-0 accent-primary dark:accent-neutral-900"
                    checked={Boolean(entry.attended)}
                    disabled={isFormLocked}
                    onChange={(inputEvent) =>
                      updatePlayer(player.id, {
                        attended: inputEvent.target.checked,
                        minutes: inputEvent.target.checked
                          ? (entry.minutes ?? DEFAULT_MATCH_MINUTES)
                          : null,
                      })
                    }
                  />
                  <span className="truncate font-medium">{player.name}</span>
                </label>
                <span className="shrink-0 text-xs text-muted-foreground">
                  Aanwezig
                </span>
              </div>

              {isMatch && entry.attended && (
                <div className="mt-3 border-t pt-3">
                  <div className="flex flex-wrap gap-3">
                    <StatNumberInput
                      label="Speelminuten"
                      value={entry.minutes}
                      placeholder={String(DEFAULT_MATCH_MINUTES)}
                      disabled={isFormLocked}
                      min={0}
                      max={120}
                      onFocus={selectInputValue}
                      onChange={(inputEvent) =>
                        updatePlayer(player.id, {
                          minutes: parseMinutes(inputEvent.target.value),
                        })
                      }
                    />

                    {!statsOpen && !isFormLocked && (
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-9 px-2 text-xs text-muted-foreground"
                          onClick={() => openPlayerStats(player.id)}
                        >
                          + goals/assists
                        </Button>
                      </div>
                    )}

                    {statsOpen && (
                      <>
                        <StatNumberInput
                          label="Goals"
                          value={entry.goals}
                          disabled={isFormLocked}
                          min={0}
                          max={20}
                          onFocus={selectInputValue}
                          onChange={(inputEvent) => {
                            const raw = inputEvent.target.value;
                            updatePlayer(player.id, {
                              goals: raw === "" ? null : parseStatValue(raw),
                            });
                          }}
                        />
                        <StatNumberInput
                          label="Assists"
                          value={entry.assists}
                          disabled={isFormLocked}
                          min={0}
                          max={20}
                          onFocus={selectInputValue}
                          onChange={(inputEvent) => {
                            const raw = inputEvent.target.value;
                            updatePlayer(player.id, {
                              assists: raw === "" ? null : parseStatValue(raw),
                            });
                          }}
                        />
                        {!isFormLocked && (
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-9 px-2 text-xs text-muted-foreground"
                              onClick={() => closePlayerStats(player.id)}
                            >
                              goals/assists verbergen
                            </Button>
                          </div>
                        )}
                      </>
                    )}

                    {!cardsOpen && !isFormLocked && (
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-9 px-2 text-xs text-muted-foreground"
                          onClick={() => openPlayerCards(player.id)}
                        >
                          + kaarten
                        </Button>
                      </div>
                    )}

                    {cardsOpen && (
                      <>
                        <StatNumberInput
                          label="Gele kaart"
                          value={entry.yellowCards}
                          disabled={isFormLocked}
                          min={0}
                          max={MAX_CARDS}
                          onFocus={selectInputValue}
                          onChange={(inputEvent) => {
                            const raw = inputEvent.target.value;
                            updatePlayer(player.id, {
                              yellowCards: raw === "" ? null : parseStatValue(raw),
                            });
                          }}
                        />
                        <StatNumberInput
                          label="Rode kaart"
                          value={entry.redCards}
                          disabled={isFormLocked}
                          min={0}
                          max={MAX_CARDS}
                          onFocus={selectInputValue}
                          onChange={(inputEvent) => {
                            const raw = inputEvent.target.value;
                            updatePlayer(player.id, {
                              redCards: raw === "" ? null : parseStatValue(raw),
                            });
                          }}
                        />
                        {!isFormLocked && (
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-9 px-2 text-xs text-muted-foreground"
                              onClick={() => closePlayerCards(player.id)}
                            >
                              Kaarten verbergen
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {canEditByDate && !readOnly && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm tabular-nums text-muted-foreground">
            {attendedCount} / {squadPlayers.length} aanwezig
          </span>
          {!isFormLocked ? (
            <Button type="button" size="sm" onClick={handleSave}>
              Opslaan
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setIsEditing(true);
                setMessage("");
              }}
            >
              Wijzigen
            </Button>
          )}
        </div>
      )}

      {readOnly && (
        <p className="text-sm tabular-nums text-muted-foreground">
          {attendedCount} / {squadPlayers.length} aanwezig
        </p>
      )}

      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
