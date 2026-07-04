"use client";

import { useEffect, useState } from "react";

import { FormationPicker } from "@/components/lineup/FormationPicker";
import { LineupField } from "@/components/lineup/LineupField";
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
import {
  createEmptyLineup,
  formatPublishedAt,
  getEligiblePlayers,
} from "@/lib/lineups";

const EMPTY_VALUE = "__empty__";

export function LineupBuilder({ event, responses, savedLineup, onSave, onPublish, onUnpublish }) {
  const [formation, setFormation] = useState(
    savedLineup?.formation ?? DEFAULT_FORMATION
  );
  const [positions, setPositions] = useState(
    savedLineup?.positions ?? createEmptyLineup().positions
  );
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    setFormation(savedLineup?.formation ?? DEFAULT_FORMATION);
    setPositions(savedLineup?.positions ?? createEmptyLineup().positions);
  }, [savedLineup, event.id]);

  const eligiblePlayers = getEligiblePlayers(event.id, responses);
  const formationData = getFormation(formation);
  const filledCount = countFilledPositions(positions);
  const isComplete = filledCount === formationData.positions.length;
  const isPublished = savedLineup?.published ?? false;

  function handleFormationChange(nextFormation) {
    setFormation(nextFormation);
    setPositions((current) => migratePositions(current, nextFormation));
    setSavedMessage("");
  }

  function handlePositionChange(slotId, playerId) {
    setPositions((current) => {
      const next = { ...current, [slotId]: playerId === EMPTY_VALUE ? null : playerId };

      if (playerId !== EMPTY_VALUE) {
        for (const key of Object.keys(next)) {
          if (key !== slotId && next[key] === playerId) {
            next[key] = null;
          }
        }
      }

      return next;
    });
    setSavedMessage("");
  }

  function handleSave() {
    onSave({ formation, positions, published: isPublished, publishedAt: savedLineup?.publishedAt ?? null });
    setSavedMessage("Opstelling opgeslagen als draft.");
  }

  function handlePublish() {
    if (!isComplete) {
      setSavedMessage("Vul alle 11 posities in vóór je publiceert.");
      return;
    }
    onPublish({ formation, positions });
    setSavedMessage("Opstelling gepubliceerd — spelers krijgen een melding.");
  }

  function handleUnpublish() {
    onUnpublish();
    setSavedMessage("Opstelling verborgen voor spelers.");
  }

  function getPlayersForSlot(slotId) {
    const currentPlayerId = positions[slotId];
    const usedElsewhere = new Set(
      Object.entries(positions)
        .filter(([id, playerId]) => id !== slotId && playerId)
        .map(([, playerId]) => playerId)
    );

    return eligiblePlayers.filter(
      (player) => player.id === currentPlayerId || !usedElsewhere.has(player.id)
    );
  }

  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Opstelling samenstellen</p>
          <p className="text-xs text-muted-foreground">
            Kies spelers uit aanwezig/twijfel ({eligiblePlayers.length} beschikbaar)
          </p>
        </div>
        {isPublished ? (
          <Badge variant="present">Gepubliceerd</Badge>
        ) : (
          <Badge variant="outline">Draft</Badge>
        )}
      </div>

      {eligiblePlayers.length === 0 && (
        <p className="rounded-md border border-dashed bg-background p-3 text-sm text-muted-foreground">
          Nog geen spelers met status aanwezig of twijfel. Laat spelers eerst
          beschikbaarheid doorgeven.
        </p>
      )}

      <FormationPicker value={formation} onChange={handleFormationChange} />

      <LineupField formationId={formation} positions={positions} />

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
                <SelectItem value={EMPTY_VALUE}>— Geen —</SelectItem>
                {getPlayersForSlot(slot.id).map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {filledCount}/{formationData.positions.length} posities ingevuld
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
          disabled={!isComplete}
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
