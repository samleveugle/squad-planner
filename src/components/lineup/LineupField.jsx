"use client";

import { cn } from "@/lib/utils";
import { getFormation } from "@/lib/formations";
import { formatPlayerWithNumber } from "@/lib/lineups";
import { usePlayers } from "@/context/PlayersContext";

export function LineupField({
  formationId,
  positions = {},
  numbers = {},
  compact = false,
  highlightPlayerId = null,
}) {
  const { getPlayerName } = usePlayers();
  const formation = getFormation(formationId);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl border-2 border-white/30 bg-gradient-to-b from-emerald-600 to-emerald-700 shadow-inner",
        compact ? "aspect-[3/4] max-w-xs mx-auto" : "aspect-[3/4] max-w-md mx-auto"
      )}
    >
      <div className="absolute inset-x-0 top-1/2 h-px bg-white/40" />
      <div className="absolute inset-x-[10%] top-[6%] h-[18%] rounded-sm border border-white/30" />
      <div className="absolute inset-x-[10%] bottom-[6%] h-[18%] rounded-sm border border-white/30" />
      <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30" />

      {formation.positions.map((slot) => {
        const playerId = positions[slot.id];
        const isHighlighted = highlightPlayerId && playerId === highlightPlayerId;
        const shirtNumber = playerId ? numbers[playerId] : null;
        const label = playerId
          ? formatPlayerWithNumber(getPlayerName(playerId), shirtNumber)
          : "—";

        return (
          <div
            key={slot.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
          >
            <div
              className={cn(
                "flex min-w-[3.5rem] max-w-[5rem] flex-col items-center rounded-md border px-1 py-1 text-center shadow-md sm:min-w-[4.5rem] sm:max-w-[6rem] sm:px-1.5",
                playerId
                  ? isHighlighted
                    ? "border-yellow-300 bg-yellow-400 text-yellow-950"
                    : "border-white/80 bg-white/95 text-emerald-950"
                  : "border-white/40 border-dashed bg-white/20 text-white/80"
              )}
            >
              <span className="text-[9px] font-semibold uppercase leading-none opacity-70 sm:text-[10px]">
                {slot.label}
              </span>
              <span className="mt-0.5 line-clamp-2 text-[10px] font-bold leading-tight sm:text-xs">
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
