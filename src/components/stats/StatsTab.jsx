import { PlayerStatsView } from "@/components/stats/PlayerStatsView";
import { SeasonSelector } from "@/components/stats/SeasonSelector";

export function StatsTab({
  currentPlayer,
  matchStats,
  attendance,
  events,
  seasonId,
  availableSeasonIds,
  onSeasonChange,
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Mijn seizoen</h2>
        <SeasonSelector
          seasonId={seasonId}
          availableSeasonIds={availableSeasonIds}
          onSeasonChange={onSeasonChange}
        />
      </div>

      <PlayerStatsView
        playerId={currentPlayer.id}
        playerName={currentPlayer.name}
        matchStats={matchStats}
        attendance={attendance}
        events={events}
        seasonId={seasonId}
      />
    </section>
  );
}
