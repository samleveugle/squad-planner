"use client";

import { useEffect, useState } from "react";

import { FormationPicker } from "@/components/lineup/FormationPicker";
import { LineupDisplay } from "@/components/lineup/LineupDisplay";
import { ShirtNumberSelect } from "@/components/lineup/ShirtNumberSelect";
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
  getFormation,
  migratePositions,
} from "@/lib/formations";
import { usePlayers } from "@/context/PlayersContext";
import {
  formatPublishedAt,
  getAllAssignedPlayerIds,
  getEligiblePlayers,
  getFieldPlayerIds,
  getMatchSquadPlayerIds,
  getVisibleBenchSlotCount,
  getVisibleStaffSlotCount,
  MAX_BENCH_PLAYERS,
  MAX_BENCH_TOTAL,
  MAX_STAFF,
  MAX_STAFF_TOTAL,
  normalizeLineup,
  pruneLineupNumbers,
  validateLineupNumbers,
} from "@/lib/lineups";

const EMPTY_VALUE = "__empty__";

function toFilledArray(values, length) {
  return Array.from({ length }, (_, index) => values[index] ?? null);
}

function compactArray(values) {
  return values.filter(Boolean);
}

function collapseTrailingEmptyExtras(values, baseCount) {
  let visible = values.length;
  while (visible > baseCount && !values[visible - 1]) {
    visible -= 1;
  }
  return visible;
}

function createLineupEditorState(savedLineup) {
  const lineup = normalizeLineup(savedLineup);
  const visibleBenchSlots = getVisibleBenchSlotCount(lineup.bench);
  const visibleStaffSlots = getVisibleStaffSlotCount(lineup.staff);

  return {
    formation: lineup.formation,
    positions: lineup.positions,
    bench: toFilledArray(lineup.bench, visibleBenchSlots),
    staff: toFilledArray(lineup.staff, visibleStaffSlots),
    numbers: lineup.numbers ?? {},
    captainId: lineup.captainId ?? null,
    visibleBenchSlots,
    visibleStaffSlots,
  };
}

export function LineupBuilder({ event, responses, savedLineup, onSave, onPublish, onUnpublish }) {
  const { players } = usePlayers();
  const initialState = createLineupEditorState(savedLineup);
  const [formation, setFormation] = useState(initialState.formation);
  const [positions, setPositions] = useState(initialState.positions);
  const [bench, setBench] = useState(initialState.bench);
  const [staff, setStaff] = useState(initialState.staff);
  const [numbers, setNumbers] = useState(initialState.numbers);
  const [captainId, setCaptainId] = useState(initialState.captainId);
  const [visibleBenchSlots, setVisibleBenchSlots] = useState(initialState.visibleBenchSlots);
  const [visibleStaffSlots, setVisibleStaffSlots] = useState(initialState.visibleStaffSlots);
  const [savedMessage, setSavedMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const nextState = createLineupEditorState(savedLineup);
    setFormation(nextState.formation);
    setPositions(nextState.positions);
    setBench(nextState.bench);
    setStaff(nextState.staff);
    setNumbers(nextState.numbers);
    setCaptainId(nextState.captainId);
    setVisibleBenchSlots(nextState.visibleBenchSlots);
    setVisibleStaffSlots(nextState.visibleStaffSlots);
    setIsEditing(false);
  }, [savedLineup, event.id]);

  useEffect(() => {
    if (!captainId) {
      return;
    }

    if (!getFieldPlayerIds(positions).includes(captainId)) {
      setCaptainId(null);
    }
  }, [positions, captainId]);

  const eligiblePlayers = getEligiblePlayers(event.id, responses, players);
  const formationData = getFormation(formation);
  const filledCount = countFilledPositions(positions);
  const isFieldComplete = filledCount === formationData.positions.length;
  const benchCount = compactArray(bench).length;
  const staffCount = compactArray(staff).length;
  const isPublished = savedLineup?.published ?? false;
  const isLocked = isPublished && !isEditing;
  const fieldPlayerIds = getFieldPlayerIds(positions);
  const fieldPlayers = fieldPlayerIds
    .map((playerId) => players.find((player) => player.id === playerId))
    .filter(Boolean);

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
    setPositions((current) =>
      migratePositions(current, nextFormation, formation)
    );
    setFormation(nextFormation);
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

      if (!nextPlayerId) {
        const nextVisible = collapseTrailingEmptyExtras(next, MAX_BENCH_PLAYERS);
        if (nextVisible !== current.length) {
          setVisibleBenchSlots(nextVisible);
          return next.slice(0, nextVisible);
        }
      }

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

      if (!nextPlayerId) {
        const nextVisible = collapseTrailingEmptyExtras(next, MAX_STAFF);
        if (nextVisible !== current.length) {
          setVisibleStaffSlots(nextVisible);
          return next.slice(0, nextVisible);
        }
      }

      return next;
    });

    if (nextPlayerId) {
      removePlayerFromOthers(nextPlayerId, { keepStaffIndex: index });
    }

    setSavedMessage("");
  }

  function handleAddExtraBenchSlot() {
    if (visibleBenchSlots >= MAX_BENCH_TOTAL) {
      return;
    }

    const nextVisible = visibleBenchSlots + 1;
    setVisibleBenchSlots(nextVisible);
    setBench((current) => toFilledArray(current, nextVisible));
    setSavedMessage("");
  }

  function handleRemoveExtraBenchSlot() {
    if (visibleBenchSlots <= MAX_BENCH_PLAYERS || bench[visibleBenchSlots - 1]) {
      return;
    }

    const nextVisible = visibleBenchSlots - 1;
    setVisibleBenchSlots(nextVisible);
    setBench((current) => current.slice(0, nextVisible));
    setSavedMessage("");
  }

  function handleAddExtraStaffSlot() {
    if (visibleStaffSlots >= MAX_STAFF_TOTAL) {
      return;
    }

    const nextVisible = visibleStaffSlots + 1;
    setVisibleStaffSlots(nextVisible);
    setStaff((current) => toFilledArray(current, nextVisible));
    setSavedMessage("");
  }

  function handleRemoveExtraStaffSlot() {
    if (visibleStaffSlots <= MAX_STAFF || staff[visibleStaffSlots - 1]) {
      return;
    }

    const nextVisible = visibleStaffSlots - 1;
    setVisibleStaffSlots(nextVisible);
    setStaff((current) => current.slice(0, nextVisible));
    setSavedMessage("");
  }

  function getUsedShirtNumbers(excludePlayerId = null) {
    const used = new Set();

    for (const [playerId, number] of Object.entries(numbers)) {
      if (playerId !== excludePlayerId && number != null) {
        used.add(number);
      }
    }

    return used;
  }

  function handleNumberChange(playerId, number) {
    setNumbers((current) => {
      const next = { ...current };

      if (number == null) {
        delete next[playerId];
      } else {
        next[playerId] = number;
      }

      return next;
    });
    setSavedMessage("");
  }

  function buildLineupPayload() {
    const squadPlayerIds = getMatchSquadPlayerIds({
      positions,
      bench: compactArray(bench),
    });

    return {
      formation,
      positions,
      bench: compactArray(bench),
      staff: compactArray(staff),
      numbers: pruneLineupNumbers(numbers, squadPlayerIds),
      captainId: fieldPlayerIds.includes(captainId) ? captainId : null,
    };
  }

  function validateBeforePersist() {
    const payload = buildLineupPayload();
    const validation = validateLineupNumbers(
      payload.numbers,
      getMatchSquadPlayerIds(payload)
    );

    if (!validation.valid) {
      setSavedMessage(validation.error);
      return false;
    }

    return true;
  }

  function handleSave() {
    if (!validateBeforePersist()) {
      return;
    }

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

    if (benchCount > MAX_BENCH_TOTAL) {
      setSavedMessage(`Maximaal ${MAX_BENCH_TOTAL} bankspelers toegestaan.`);
      return;
    }

    if (staffCount > MAX_STAFF_TOTAL) {
      setSavedMessage(`Maximaal ${MAX_STAFF_TOTAL} stafleden toegestaan.`);
      return;
    }

    if (!validateBeforePersist()) {
      return;
    }

    onPublish(buildLineupPayload());
    setIsEditing(false);
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

      <FormationPicker
        value={formation}
        onChange={handleFormationChange}
        disabled={isLocked}
      />

      <LineupDisplay
        formationId={formation}
        positions={positions}
        bench={bench.slice(0, visibleBenchSlots)}
        staff={staff.slice(0, visibleStaffSlots)}
        numbers={numbers}
        captainId={captainId}
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
                disabled={isLocked}
              >
                <SelectTrigger className="h-8 min-w-0 flex-1 text-xs">
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
              <ShirtNumberSelect
                playerId={positions[slot.id]}
                value={positions[slot.id] ? numbers[positions[slot.id]] : null}
                onChange={handleNumberChange}
                usedNumbers={getUsedShirtNumbers(positions[slot.id])}
                disabled={isLocked}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Kapitein</p>
        <Select
          value={captainId ?? EMPTY_VALUE}
          onValueChange={(value) => {
            setCaptainId(value === EMPTY_VALUE ? null : value);
            setSavedMessage("");
          }}
          disabled={isLocked || fieldPlayers.length === 0}
        >
          <SelectTrigger className="h-8 max-w-xs text-xs">
            <SelectValue placeholder="Kies kapitein" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={EMPTY_VALUE}>Geen kapitein</SelectItem>
            {fieldPlayers.map((player) => (
              <SelectItem key={player.id} value={player.id}>
                {player.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Bank</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {bench.slice(0, visibleBenchSlots).map((playerId, index) => (
            <div key={`bench-select-${index}`} className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-xs font-semibold text-muted-foreground">
                Bank {index + 1}
              </span>
              <Select
                value={playerId ?? EMPTY_VALUE}
                onValueChange={(value) => handleBenchChange(index, value)}
                disabled={isLocked}
              >
                <SelectTrigger className="h-8 min-w-0 flex-1 text-xs">
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
              <ShirtNumberSelect
                playerId={playerId}
                value={playerId ? numbers[playerId] : null}
                onChange={handleNumberChange}
                usedNumbers={getUsedShirtNumbers(playerId)}
                disabled={isLocked}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {visibleBenchSlots < MAX_BENCH_TOTAL && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground"
              onClick={handleAddExtraBenchSlot}
              disabled={isLocked}
            >
              + Extra bankspeler
            </Button>
          )}
          {visibleBenchSlots > MAX_BENCH_PLAYERS &&
            !bench[visibleBenchSlots - 1] && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground"
                onClick={handleRemoveExtraBenchSlot}
                disabled={isLocked}
              >
                Extra slot verwijderen
              </Button>
            )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Staf</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {staff.slice(0, visibleStaffSlots).map((playerId, index) => (
            <div key={`staff-select-${index}`} className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-xs font-semibold text-muted-foreground">
                Staf {index + 1}
              </span>
              <Select
                value={playerId ?? EMPTY_VALUE}
                onValueChange={(value) => handleStaffChange(index, value)}
                disabled={isLocked}
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
        <div className="mt-2 flex flex-wrap gap-2">
          {visibleStaffSlots < MAX_STAFF_TOTAL && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground"
              onClick={handleAddExtraStaffSlot}
              disabled={isLocked}
            >
              + Extra staflid
            </Button>
          )}
          {visibleStaffSlots > MAX_STAFF && !staff[visibleStaffSlots - 1] && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground"
              onClick={handleRemoveExtraStaffSlot}
              disabled={isLocked}
            >
              Extra slot verwijderen
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Veld: {filledCount}/{formationData.positions.length} · Bank: {benchCount}/
        {visibleBenchSlots} · Staf: {staffCount}/{visibleStaffSlots}
        {savedLineup?.publishedAt && isPublished && (
          <> · Laatst gepubliceerd: {formatPublishedAt(savedLineup.publishedAt)}</>
        )}
      </p>

      <div className="flex flex-wrap gap-2">
        {!isPublished && (
          <Button type="button" variant="secondary" size="sm" onClick={handleSave}>
            Opslaan
          </Button>
        )}
        {isPublished && isLocked ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setIsEditing(true);
              setSavedMessage("");
            }}
          >
            Wijzigen
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={handlePublish}
            disabled={!isFieldComplete}
          >
            Publiceren
          </Button>
        )}
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
