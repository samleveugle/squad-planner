"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PLAYERS } from "@/lib/mock-data";
import {
  buildStatsPayload,
  createDraftFromSaved,
  hasRecordedStats,
  parseStatValue,
} from "@/lib/stats";

export function MatchStatsForm({ event, matchStats, onSave }) {
  const [draft, setDraft] = useState(() => createDraftFromSaved(matchStats, event.id));
  const [message, setMessage] = useState("");

  useEffect(() => {
    setDraft(createDraftFromSaved(matchStats, event.id));
  }, [matchStats, event.id]);

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
    setMessage("Stats opgeslagen voor deze wedstrijd.");
  }

  const hasStats = hasRecordedStats(matchStats, event.id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Vul goals en assists in per speler (0 of meer).
        </p>
        {hasStats && (
          <span className="text-xs font-medium text-emerald-600">Stats ingevuld</span>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[320px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-3 py-2 font-medium">Speler</th>
              <th className="px-3 py-2 font-medium w-20">Goals</th>
              <th className="px-3 py-2 font-medium w-20">Assists</th>
            </tr>
          </thead>
          <tbody>
            {PLAYERS.map((player) => (
              <tr key={player.id} className="border-b last:border-b-0">
                <td className="px-3 py-2">{player.name}</td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    className="h-8 w-16"
                    value={draft[player.id]?.goals ?? 0}
                    onChange={(event) =>
                      handleChange(player.id, "goals", event.target.value)
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
                    onChange={(event) =>
                      handleChange(player.id, "assists", event.target.value)
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
