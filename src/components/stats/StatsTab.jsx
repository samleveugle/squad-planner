import { PlayerStatsView } from "@/components/stats/PlayerStatsView";

export function StatsTab({ currentPlayer, matchStats, attendance, events }) {
  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold">Mijn seizoen</h2>

      <PlayerStatsView
        playerId={currentPlayer.id}
        playerName={currentPlayer.name}
        matchStats={matchStats}
        attendance={attendance}
        events={events}
      />
    </section>
  );
}
