"use client";

import { useEffect, useState } from "react";

import {
  createPlayer,
  deletePlayer,
  updatePlayer,
} from "@/app/actions/players";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function RoleBadge({ label, active }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs ${
        active
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {label}
    </span>
  );
}

function PlayerForm({ initial, submitLabel, onSubmit, onCancel }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [isAdmin, setIsAdmin] = useState(initial?.isAdmin ?? false);
  const [isSquadPlayer, setIsSquadPlayer] = useState(initial?.isSquadPlayer ?? true);
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const result = await onSubmit({
      name,
      email,
      isAdmin,
      isSquadPlayer,
    });

    if (result.success) {
      onCancel?.();
    } else {
      setMessage(result.error);
    }

    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border bg-background p-4">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="player-name">
          Naam
        </label>
        <Input
          id="player-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="player-email">
          E-mail (voor login)
        </label>
        <Input
          id="player-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="optioneel"
        />
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={(event) => setIsAdmin(event.target.checked)}
          />
          Admin
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSquadPlayer}
            onChange={(event) => setIsSquadPlayer(event.target.checked)}
          />
          Ploegspeler
        </label>
      </div>

      {message && <p className="text-sm text-red-600 dark:text-red-400">{message}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "Opslaan..." : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Annuleren
          </Button>
        )}
      </div>
    </form>
  );
}

function PlayerRow({ player, onUpdated, onDeleted, readOnly = false }) {
  const [isEditing, setIsEditing] = useState(false);

  async function handleUpdate(values) {
    const result = await updatePlayer(player.id, values);
    if (result.success) {
      onUpdated(result.player);
    }
    return result;
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Speler "${player.name}" verwijderen? Dit kan niet ongedaan worden gemaakt.`
    );

    if (!confirmed) {
      return;
    }

    const result = await deletePlayer(player.id);
    if (result.success) {
      onDeleted(player.id);
    } else {
      window.alert(result.error);
    }
  }

  if (isEditing) {
    return (
      <PlayerForm
        initial={player}
        submitLabel="Opslaan"
        onSubmit={handleUpdate}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="font-medium">{player.name}</p>
        <p className="text-xs text-muted-foreground">
          {player.email || "Geen e-mail — kan niet inloggen"}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <RoleBadge label="Admin" active={player.isAdmin} />
          <RoleBadge label="Ploegspeler" active={player.isSquadPlayer} />
        </div>
      </div>

      {!readOnly && (
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Bewerken
          </Button>
          <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
            Verwijderen
          </Button>
        </div>
      )}
    </div>
  );
}

export function PlayersManager({ players, onPlayersChange, readOnly = false }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [localPlayers, setLocalPlayers] = useState(players);

  useEffect(() => {
    setLocalPlayers(players);
  }, [players]);

  function syncPlayers(nextPlayers) {
    setLocalPlayers(nextPlayers);
    onPlayersChange(nextPlayers);
  }

  async function handleCreate(values) {
    const result = await createPlayer(values);

    if (result.success) {
      const nextPlayers = [...localPlayers, result.player].sort((a, b) =>
        a.name.localeCompare(b.name, "nl-BE")
      );
      syncPlayers(nextPlayers);
      setShowAddForm(false);
    }

    return result;
  }

  function handleUpdated(updatedPlayer) {
    syncPlayers(
      localPlayers
        .map((player) => (player.id === updatedPlayer.id ? updatedPlayer : player))
        .sort((a, b) => a.name.localeCompare(b.name, "nl-BE"))
    );
  }

  function handleDeleted(playerId) {
    syncPlayers(localPlayers.filter((player) => player.id !== playerId));
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Spelers</h2>
        {!readOnly && !showAddForm && (
          <Button type="button" size="sm" onClick={() => setShowAddForm(true)}>
            Speler toevoegen
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ploegleden</CardTitle>
          <CardDescription>
            {readOnly
              ? "Demo-overzicht van de fictieve ploeg (alleen bekijken)."
              : "Voeg spelers toe, stel e-mail in voor magic-link login, en bepaal admin/ploegspeler rollen."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {showAddForm && (
            <PlayerForm
              submitLabel="Toevoegen"
              onSubmit={handleCreate}
              onCancel={() => setShowAddForm(false)}
            />
          )}

          {localPlayers.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nog geen spelers in de database.
            </p>
          ) : (
            localPlayers.map((player) => (
              <PlayerRow
                key={player.id}
                player={player}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
                readOnly={readOnly}
              />
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
