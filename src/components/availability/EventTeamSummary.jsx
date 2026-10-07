"use client";

import { AvailabilityBadge } from "@/components/availability/AvailabilityBadge";
import { PlayerNameList } from "@/components/availability/PlayerNameList";
import { usePlayers } from "@/context/PlayersContext";
import { getResponseKey } from "@/lib/mock-data";
import { formatRoleBreakdown } from "@/lib/players";

export function EventTeamSummary({
  eventId,
  responses,
  currentPlayerId,
  lateAbsences = {},
}) {
  const { getEventResponseSummary } = usePlayers();
  const { present, doubt, absent, unanswered } = getEventResponseSummary(
    eventId,
    responses
  );
  const respondedCount = present.length + doubt.length + absent.length;
  const totalPlayers = respondedCount + unanswered.length;
  const latePlayerIds = new Set(
    [...doubt, ...absent]
      .filter((player) => lateAbsences[getResponseKey(player.id, eventId)])
      .map((player) => player.id)
  );

  return (
    <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Live overzicht ploeg</p>
        <p className="text-xs text-muted-foreground">
          {respondedCount}/{totalPlayers} gereageerd
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <AvailabilityBadge status="present" />
            <span className="text-xs text-muted-foreground">
              {formatRoleBreakdown(present)}
            </span>
          </div>
          <PlayerNameList players={present} emptyText="—" />
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <AvailabilityBadge status="doubt" />
            <span className="text-xs text-muted-foreground">
              {formatRoleBreakdown(doubt)}
            </span>
          </div>
          <PlayerNameList
            players={doubt}
            emptyText="—"
            lateAbsenceIds={latePlayerIds}
          />
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <AvailabilityBadge status="absent" />
            <span className="text-xs text-muted-foreground">
              {formatRoleBreakdown(absent)}
            </span>
          </div>
          <PlayerNameList
            players={absent}
            emptyText="—"
            lateAbsenceIds={latePlayerIds}
          />
        </div>
      </div>

      {unanswered.length > 0 &&
        currentPlayerId &&
        unanswered.some((player) => player.id === currentPlayerId) && (
          <p className="text-xs text-muted-foreground">Jij hebt nog niet gereageerd.</p>
        )}
    </div>
  );
}
