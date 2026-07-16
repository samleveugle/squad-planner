"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getMatchSquadPlayers,
  hasMatchSquad,
  normalizeLineup,
} from "@/lib/lineups";
import {
  buildStatsPayload,
  createDraftFromSaved,
  hasRecordedStats,
  parseStatValue,
} from "@/lib/stats";
import { usePlayers } from "@/context/PlayersContext";

export function MatchStatsForm({ event, matchStats, lineups, onSave }) {
  const { players } = usePlayers();
  const lineup = lineups[event.id] ?? null;
  const squadPlayers = useMemo(
    () => getMatchSquadPlayers(normalizeLineup(lineup), players),
    [lineup, players]
  );
  const squadPlayerIds = useMemo(
    () => squadPlayers.map((player) => player.id),
    [squadPlayers]
  );

  const [draft, setDraft] = useState(() =>
    createDraftFromSaved(matchStats, event.id, squadPlayerIds)
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    setDraft(createDraftFromSaved(matchStats, event.id, squadPlayerIds));
  }, [matchStats, event.id, squadPlayerIds]);

  function handleChange(playerId, field, value) {
    setDraft((current) => ({
      ...current,
      [playerId]: {
        ...current[playerId],
        [field]: parseStatValue(value),
      },
    }));
    setMessage("");
  }

  function handleSave() {
    onSave(event.id, buildStatsPayload(draft));
    setMessage("Stats opgeslagen.");
  }

  if (!hasMatchSquad(lineup)) {
    return (
      <p className="rounded-md border border-dashed bg-background p-4 text-sm text-muted-foreground">
        Stel eerst een opstelling samen voor deze wedstrijd.
      </p>
    );
  }

  const hasStats = hasRecordedStats(matchStats, event.id);

  return (
    <div className="space-y-4">
      {hasStats && (
        <span className="text-xs font-medium text-emerald-600">Stats ingevuld</span>
      )}

      <div className="space-y-3 sm:hidden">
        {squadPlayers.map((player) => (
          <div key={player.id} className="rounded-lg border p-3">
            <p className="mb-2 font-medium">{player.name}</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-muted-foreground">Goals</label>
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  className="h-8"
                  value={draft[player.id]?.goals ?? 0}
                  onChange={(inputEvent) =>
                    handleChange(player.id, "goals", inputEvent.target.value)
                  }
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-muted-foreground">Assists</label>
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  className="h-8"
                  value={draft[player.id]?.assists ?? 0}
                  onChange={(inputEvent) =>
                    handleChange(player.id, "assists", inputEvent.target.value)
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border sm:block">
        <table className="w-full min-w-[320px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-2 font-medium">Speler</th>
              <th className="w-20 px-3 py-2 font-medium">Goals</th>
              <th className="w-20 px-3 py-2 font-medium">Assists</th>
            </tr>
          </thead>
          <tbody>
            {squadPlayers.map((player) => (
              <tr key={player.id} className="border-b last:border-b-0">
                <td className="px-3 py-2">{player.name}</td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    className="h-8 w-16"
                    value={draft[player.id]?.goals ?? 0}
                    onChange={(inputEvent) =>
                      handleChange(player.id, "goals", inputEvent.target.value)
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    className="h-8 w-16"
                    value={draft[player.id]?.assists ?? 0}
                    onChange={(inputEvent) =>
                      handleChange(player.id, "assists", inputEvent.target.value)
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button type="button" size="sm" onClick={handleSave}>
        Stats opslaan
      </Button>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
