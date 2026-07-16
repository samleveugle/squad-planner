"use client";

import { useEffect, useState } from "react";

import { FormationPicker } from "@/components/lineup/FormationPicker";
import { LineupDisplay } from "@/components/lineup/LineupDisplay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  countFilledPositions,
  DEFAULT_FORMATION,
  getFormation,
  migratePositions,
} from "@/lib/formations";
import { usePlayers } from "@/context/PlayersContext";
import {
  createEmptyLineup,
  formatPublishedAt,
  getAllAssignedPlayerIds,
  getEligiblePlayers,
  MAX_BENCH_PLAYERS,
  MAX_STAFF,
  normalizeLineup,
} from "@/lib/lineups";

const EMPTY_VALUE = "__empty__";

function toFilledArray(values, length) {
  return Array.from({ length }, (_, index) => values[index] ?? null);
}

function compactArray(values) {
  return values.filter(Boolean);
}

export function LineupBuilder({ event, responses, savedLineup, onSave, onPublish, onUnpublish }) {
  const { players } = usePlayers();
  const normalizedSaved = normalizeLineup(savedLineup);
  const [formation, setFormation] = useState(normalizedSaved.formation);
  const [positions, setPositions] = useState(normalizedSaved.positions);
  const [bench, setBench] = useState(() => toFilledArray(normalizedSaved.bench, MAX_BENCH_PLAYERS));
  const [staff, setStaff] = useState(() => toFilledArray(normalizedSaved.staff, MAX_STAFF));
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    const lineup = normalizeLineup(savedLineup);
    setFormation(lineup.formation);
    setPositions(lineup.positions);
    setBench(toFilledArray(lineup.bench, MAX_BENCH_PLAYERS));
    setStaff(toFilledArray(lineup.staff, MAX_STAFF));
  }, [savedLineup, event.id]);

  const eligiblePlayers = getEligiblePlayers(event.id, responses, players);
  const formationData = getFormation(formation);
  const filledCount = countFilledPositions(positions);
  const isFieldComplete = filledCount === formationData.positions.length;
  const benchCount = compactArray(bench).length;
  const staffCount = compactArray(staff).length;
  const isPublished = savedLineup?.published ?? false;

  function getUsedPlayerIds(exclude = {}) {
    const used = getAllAssignedPlayerIds({
      positions,
      bench: compactArray(bench),
      staff: compactArray(staff),
    });

    if (exclude.allowPlayerId) {
      used.delete(exclude.allowPlayerId);
    }

    return used;
  }

  function removePlayerFromOthers(playerId, { keepField, keepBenchIndex, keepStaffIndex }) {
    if (!playerId || playerId === EMPTY_VALUE) {
      return;
    }

    setPositions((current) => {
      const next = { ...current };
      for (const key of Object.keys(next)) {
        if (next[key] === playerId && key !== keepField) {
          next[key] = null;
        }
      }
      return next;
    });

    setBench((current) =>
      current.map((id, index) =>
        id === playerId && index !== keepBenchIndex ? null : id
      )
    );

    setStaff((current) =>
      current.map((id, index) =>
        id === playerId && index !== keepStaffIndex ? null : id
      )
    );
  }

  function handleFormationChange(nextFormation) {
    setFormation(nextFormation);
    setPositions((current) => migratePositions(current, nextFormation));
    setSavedMessage("");
  }

  function handlePositionChange(slotId, playerId) {
    const nextPlayerId = playerId === EMPTY_VALUE ? null : playerId;

    setPositions((current) => {
      const next = { ...current, [slotId]: nextPlayerId };

      if (nextPlayerId) {
        for (const key of Object.keys(next)) {
          if (key !== slotId && next[key] === nextPlayerId) {
            next[key] = null;
          }
        }
      }

      return next;
    });

    if (nextPlayerId) {
      removePlayerFromOthers(nextPlayerId, { keepField: slotId });
    }

    setSavedMessage("");
  }

  function handleBenchChange(index, playerId) {
    const nextPlayerId = playerId === EMPTY_VALUE ? null : playerId;

    setBench((current) => {
      const next = [...current];
      next[index] = nextPlayerId;
      return next;
    });

    if (nextPlayerId) {
      removePlayerFromOthers(nextPlayerId, { keepBenchIndex: index });
    }

    setSavedMessage("");
  }

  function handleStaffChange(index, playerId) {
    const nextPlayerId = playerId === EMPTY_VALUE ? null : playerId;

    setStaff((current) => {
      const next = [...current];
      next[index] = nextPlayerId;
      return next;
    });

    if (nextPlayerId) {
      removePlayerFromOthers(nextPlayerId, { keepStaffIndex: index });
    }

    setSavedMessage("");
  }

  function buildLineupPayload() {
    return {
      formation,
      positions,
      bench: compactArray(bench),
      staff: compactArray(staff),
    };
  }

  function handleSave() {
    onSave({
      ...buildLineupPayload(),
      published: isPublished,
      publishedAt: savedLineup?.publishedAt ?? null,
    });
    setSavedMessage("Opstelling opgeslagen als draft.");
  }

  function handlePublish() {
    if (!isFieldComplete) {
      setSavedMessage("Vul alle 11 veldposities in vóór je publiceert.");
      return;
    }

    if (benchCount > MAX_BENCH_PLAYERS) {
      setSavedMessage(`Maximaal ${MAX_BENCH_PLAYERS} bankspelers toegestaan.`);
      return;
    }

    if (staffCount > MAX_STAFF) {
      setSavedMessage(`Maximaal ${MAX_STAFF} stafleden toegestaan.`);
      return;
    }

    onPublish(buildLineupPayload());
    setSavedMessage("Opstelling gepubliceerd — spelers krijgen een melding.");
  }

  function handleUnpublish() {
    onUnpublish();
    setSavedMessage("Opstelling verborgen voor spelers.");
  }

  function getPlayersForSlot(currentPlayerId) {
    const used = getUsedPlayerIds({ allowPlayerId: currentPlayerId });
    return eligiblePlayers.filter(
      (player) => player.id === currentPlayerId || !used.has(player.id)
    );
  }

  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Opstelling samenstellen</p>
        {isPublished ? (
          <Badge variant="present">Gepubliceerd</Badge>
        ) : (
          <Badge variant="outline">Draft</Badge>
        )}
      </div>

      {eligiblePlayers.length === 0 && (
        <p className="rounded-md border border-dashed bg-background p-3 text-sm text-muted-foreground">
          Nog geen spelers met status aanwezig of twijfel.
        </p>
      )}

      <FormationPicker value={formation} onChange={handleFormationChange} />

      <LineupDisplay
        formationId={formation}
        positions={positions}
        bench={bench}
        staff={staff}
      />

      <div>
        <p className="mb-2 text-sm font-medium">Basis</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {formationData.positions.map((slot) => (
            <div key={slot.id} className="flex items-center gap-2">
              <span className="w-8 shrink-0 text-xs font-semibold text-muted-foreground">
                {slot.label}
              </span>
              <Select
                value={positions[slot.id] ?? EMPTY_VALUE}
                onValueChange={(value) => handlePositionChange(slot.id, value)}
              >
                <SelectTrigger className="h-8 flex-1 text-xs">
                  <SelectValue placeholder="Kies speler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_VALUE}></SelectItem>
                  {getPlayersForSlot(positions[slot.id]).map((player) => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Bank</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {bench.map((playerId, index) => (
            <div key={`bench-select-${index}`} className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-xs font-semibold text-muted-foreground">
                Bank {index + 1}
              </span>
              <Select
                value={playerId ?? EMPTY_VALUE}
                onValueChange={(value) => handleBenchChange(index, value)}
              >
                <SelectTrigger className="h-8 flex-1 text-xs">
                  <SelectValue placeholder="Kies speler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_VALUE}></SelectItem>
                  {getPlayersForSlot(playerId).map((player) => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Staf</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {staff.map((playerId, index) => (
            <div key={`staff-select-${index}`} className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-xs font-semibold text-muted-foreground">
                Staf {index + 1}
              </span>
              <Select
                value={playerId ?? EMPTY_VALUE}
                onValueChange={(value) => handleStaffChange(index, value)}
              >
                <SelectTrigger className="h-8 flex-1 text-xs">
                  <SelectValue placeholder="Kies speler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_VALUE}></SelectItem>
                  {getPlayersForSlot(playerId).map((player) => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Veld: {filledCount}/{formationData.positions.length} · Bank: {benchCount}/
        {MAX_BENCH_PLAYERS} · Staf: {staffCount}/{MAX_STAFF}
        {savedLineup?.publishedAt && isPublished && (
          <> · Laatst gepubliceerd: {formatPublishedAt(savedLineup.publishedAt)}</>
        )}
      </p>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={handleSave}>
          Opslaan
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handlePublish}
          disabled={!isFieldComplete}
        >
          Publiceren
        </Button>
        {isPublished && (
          <Button type="button" variant="outline" size="sm" onClick={handleUnpublish}>
            Verbergen
          </Button>
        )}
      </div>

      {savedMessage && (
        <p className="text-sm text-muted-foreground">{savedMessage}</p>
      )}
    </div>
  );
}
