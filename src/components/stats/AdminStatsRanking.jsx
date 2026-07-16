"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePlayers } from "@/context/PlayersContext";
import { getSeasonRanking } from "@/lib/stats";

export function AdminStatsRanking({ matchStats }) {
  const [sortBy, setSortBy] = useState("goals");
  const { getSquadPlayers } = usePlayers();
  const ranking = getSeasonRanking(matchStats, getSquadPlayers(), sortBy);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Seizoensranking</h3>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={sortBy === "goals" ? "default" : "outline"}
            onClick={() => setSortBy("goals")}
          >
            Sorteer op goals
          </Button>
          <Button
            type="button"
            size="sm"
            variant={sortBy === "assists" ? "default" : "outline"}
            onClick={() => setSortBy("assists")}
          >
            Sorteer op assists
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[280px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-2 font-medium w-10">#</th>
              <th className="px-3 py-2 font-medium">Speler</th>
              <th className="px-3 py-2 font-medium w-16">Goals</th>
              <th className="px-3 py-2 font-medium w-16">Assists</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map(({ player, goals, assists }, index) => (
              <tr key={player.id} className="border-b last:border-b-0">
                <td className="px-3 py-2 text-muted-foreground">{index + 1}</td>
                <td className="px-3 py-2 font-medium">{player.name}</td>
                <td className="px-3 py-2">
                  <Badge variant={sortBy === "goals" && goals > 0 ? "present" : "outline"}>
                    {goals}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  <Badge variant={sortBy === "assists" && assists > 0 ? "secondary" : "outline"}>
                    {assists}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
