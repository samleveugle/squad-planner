"use client";

import { AvailabilityBadge } from "@/components/availability/AvailabilityBadge";
import { PlayerNameList } from "@/components/availability/PlayerNameList";
import { usePlayers } from "@/context/PlayersContext";

export function EventTeamSummary({ eventId, responses, currentPlayerId }) {
  const { getEventResponseSummary } = usePlayers();
  const { present, doubt, absent, unanswered } = getEventResponseSummary(
    eventId,
    responses
  );
  const respondedCount = present.length + doubt.length + absent.length;
  const totalPlayers = respondedCount + unanswered.length;

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
          <div className="flex items-center gap-2">
            <AvailabilityBadge status="present" />
            <span className="text-xs text-muted-foreground">{present.length}</span>
          </div>
          <PlayerNameList players={present} emptyText="—" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AvailabilityBadge status="doubt" />
            <span className="text-xs text-muted-foreground">{doubt.length}</span>
          </div>
          <PlayerNameList players={doubt} emptyText="—" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AvailabilityBadge status="absent" />
            <span className="text-xs text-muted-foreground">{absent.length}</span>
          </div>
          <PlayerNameList players={absent} emptyText="—" />
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
