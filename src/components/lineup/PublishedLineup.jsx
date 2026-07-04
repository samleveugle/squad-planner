"use client";

import { useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { LineupField } from "@/components/lineup/LineupField";
import { getFormation } from "@/lib/formations";
import { formatPublishedAt } from "@/lib/lineups";

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
  const isInLineup =
    currentPlayerId && Object.values(lineup.positions).includes(currentPlayerId);

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

      <LineupField
        formationId={lineup.formation}
        positions={lineup.positions}
        compact={compact}
        highlightPlayerId={currentPlayerId}
      />

      <p className="text-center text-xs text-muted-foreground">
        {filledCount}/{formation.positions.length} posities ingevuld
        {isInLineup && " · Jij staat in de opstelling!"}
      </p>
    </div>
  );
}
