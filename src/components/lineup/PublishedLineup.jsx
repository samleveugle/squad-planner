"use client";

import { useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { LineupDisplay } from "@/components/lineup/LineupDisplay";
import { getFormation } from "@/lib/formations";
import {
  formatPublishedAt,
  getPlayerLineupRole,
  getLineupRoleLabel,
} from "@/lib/lineups";

export function PublishedLineup({
  lineup,
  currentPlayerId = null,
  compact = false,
  onView,
}) {
  useEffect(() => {
    onView?.();
  }, []);

  if (!lineup?.published) {
    return null;
  }

  const filledCount = Object.values(lineup.positions).filter(Boolean).length;
  const formation = getFormation(lineup.formation);
  const bench = lineup.bench ?? [];
  const staff = lineup.staff ?? [];
  const playerRole = getPlayerLineupRole(lineup, currentPlayerId);
  const roleLabel = getLineupRoleLabel(playerRole);

  return (
    <div className="space-y-3 rounded-lg border bg-emerald-50/50 p-4 dark:bg-emerald-950/20">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Opstelling ({lineup.formation})</p>
          {lineup.publishedAt && (
            <p className="text-xs text-muted-foreground">
              Gepubliceerd op {formatPublishedAt(lineup.publishedAt)}
            </p>
          )}
        </div>
        <Badge variant="present">Gepubliceerd</Badge>
      </div>

      <LineupDisplay
        formationId={lineup.formation}
        positions={lineup.positions}
        bench={bench}
        staff={staff}
        compact={compact}
        highlightPlayerId={currentPlayerId}
      />

      <p className="text-center text-xs text-muted-foreground">
        Veld: {filledCount}/{formation.positions.length}
        {bench.length > 0 && ` · Bank: ${bench.length}`}
        {staff.length > 0 && ` · Staf: ${staff.length}`}
        {roleLabel && ` · Jij staat op de ${roleLabel.toLowerCase()}!`}
      </p>
    </div>
  );
}
