"use client";

import { cn } from "@/lib/utils";
import { formatPlayerWithNumber, MAX_BENCH_PLAYERS, MAX_STAFF } from "@/lib/lineups";
import { usePlayers } from "@/context/PlayersContext";

function PlayerBadge({ playerId, highlight = false, label, shirtNumber = null }) {
  const { getPlayerName } = usePlayers();

  return (
    <div
      className={cn(
        "rounded-md border px-2 py-1.5 text-center text-xs font-medium shadow-sm",
        playerId
          ? highlight
            ? "border-yellow-300 bg-yellow-400 text-yellow-950"
            : "border-border bg-background text-foreground"
          : "border-dashed border-muted-foreground/30 bg-muted/30 text-muted-foreground"
      )}
    >
      {label && (
        <span className="mb-0.5 block text-[10px] font-normal uppercase opacity-70">
          {label}
        </span>
      )}
      {playerId ? formatPlayerWithNumber(getPlayerName(playerId), shirtNumber) : "—"}
    </div>
  );
}

export function LineupBenchStaff({
  bench = [],
  staff = [],
  numbers = {},
  highlightPlayerId = null,
}) {
  const benchSlots = Array.from({ length: MAX_BENCH_PLAYERS }, (_, index) => bench[index] ?? null);
  const staffSlots = Array.from({ length: MAX_STAFF }, (_, index) => staff[index] ?? null);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-semibold">Bank</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
          {benchSlots.map((playerId, index) => (
            <PlayerBadge
              key={`bench-${index}`}
              playerId={playerId}
              label={`Bank ${index + 1}`}
              shirtNumber={playerId ? numbers[playerId] : null}
              highlight={highlightPlayerId && playerId === highlightPlayerId}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Staf</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
          {staffSlots.map((playerId, index) => (
            <PlayerBadge
              key={`staff-${index}`}
              playerId={playerId}
              label={`Staf ${index + 1}`}
              highlight={highlightPlayerId && playerId === highlightPlayerId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
