import { AdminStatsRanking } from "@/components/stats/AdminStatsRanking";
import { PlayerStatsView } from "@/components/stats/PlayerStatsView";

export function StatsTab({ currentPlayer, matchStats }) {
  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold">Stats</h2>

      <PlayerStatsView
        playerId={currentPlayer.id}
        playerName={currentPlayer.name}
        matchStats={matchStats}
      />

      {currentPlayer.isAdmin && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <AdminStatsRanking matchStats={matchStats} />
        </div>
      )}
    </section>
  );
}
