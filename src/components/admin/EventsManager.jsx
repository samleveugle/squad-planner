"use client";

import { useEffect, useMemo, useState } from "react";

import { createEvent, deleteEvent, updateEvent } from "@/app/actions/events";
import { syncRbfaCalendarAction } from "@/app/actions/rbfa-sync";
import { WeekNavigator } from "@/components/calendar/WeekNavigator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  formatEventDate,
  formatEventTime,
  getEventTitle,
  getEventsForWeek,
} from "@/lib/events";

const DEFAULT_TRAINING = {
  time: "20:30",
  location: "SK Laar",
};

const DEFAULT_HOME_MATCH = {
  time: "10:30",
  location: "SK Laar",
};

function EventForm({ initial, submitLabel, onSubmit, onCancel }) {
  const [type, setType] = useState(initial?.type ?? "training");
  const [date, setDate] = useState(initial?.date ?? "");
  const [time, setTime] = useState(initial?.time ?? "");
  const [location, setLocation] = useState(initial?.location ?? DEFAULT_TRAINING.location);
  const [isHome, setIsHome] = useState(initial?.isHome ?? true);
  const [opponent, setOpponent] = useState(initial?.opponent ?? "");
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleTypeChange(nextType) {
    setType(nextType);

    if (!initial) {
      if (nextType === "training") {
        setTime(DEFAULT_TRAINING.time);
        setLocation(DEFAULT_TRAINING.location);
      } else if (isHome) {
        setTime(DEFAULT_HOME_MATCH.time);
        setLocation(DEFAULT_HOME_MATCH.location);
      } else {
        setTime("");
        setLocation("Verplaatsing");
      }
    }
  }

  function handleHomeChange(nextIsHome) {
    setIsHome(nextIsHome);

    if (!initial && type === "match") {
      if (nextIsHome) {
        setTime(DEFAULT_HOME_MATCH.time);
        setLocation(DEFAULT_HOME_MATCH.location);
      } else {
        setTime("");
        setLocation("Verplaatsing");
      }
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const result = await onSubmit({
      type,
      date,
      time,
      location,
      isHome: type === "match" ? isHome : undefined,
      opponent: type === "match" ? opponent : null,
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
        <label className="text-sm font-medium" htmlFor="event-type">
          Type
        </label>
        <select
          id="event-type"
          value={type}
          onChange={(event) => handleTypeChange(event.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          <option value="training">Training</option>
          <option value="match">Wedstrijd</option>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="event-date">
            Datum
          </label>
          <Input
            id="event-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="event-time">
            Tijd (optioneel)
          </label>
          <Input
            id="event-time"
            type="time"
            value={time ?? ""}
            onChange={(event) => setTime(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="event-location">
          Locatie
        </label>
        <Input
          id="event-location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          required
        />
      </div>

      {type === "match" && (
        <>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="is-home"
                checked={isHome}
                onChange={() => handleHomeChange(true)}
              />
              Thuis
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="is-home"
                checked={!isHome}
                onChange={() => handleHomeChange(false)}
              />
              Uit
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="event-opponent">
              Tegenstander (optioneel)
            </label>
            <Input
              id="event-opponent"
              value={opponent ?? ""}
              onChange={(event) => setOpponent(event.target.value)}
              placeholder="bijv. FC Test"
            />
          </div>
        </>
      )}

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

function EventRow({ event, onUpdated, onDeleted }) {
  const [isEditing, setIsEditing] = useState(false);

  async function handleUpdate(values) {
    const result = await updateEvent(event.id, values);
    if (result.success) {
      onUpdated(result.event);
    }
    return result;
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `"${getEventTitle(event)}" op ${formatEventDate(event.date)} verwijderen? Beschikbaarheid, opstelling en stats voor dit event worden ook verwijderd.`
    );

    if (!confirmed) {
      return;
    }

    const result = await deleteEvent(event.id);
    if (result.success) {
      onDeleted(event.id);
    } else {
      window.alert(result.error);
    }
  }

  if (isEditing) {
    return (
      <EventForm
        initial={event}
        submitLabel="Opslaan"
        onSubmit={handleUpdate}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="font-medium">{getEventTitle(event)}</p>
        <p className="text-xs text-muted-foreground">
          {formatEventDate(event.date)} · {formatEventTime(event)} · {event.location}
        </p>
        {event.type === "match" && (
          <p className="text-xs text-muted-foreground">
            {event.isHome ? "Thuis" : "Uit"}
            {event.opponent ? ` · vs ${event.opponent}` : ""}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          Bewerken
        </Button>
        <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
          Verwijderen
        </Button>
      </div>
    </div>
  );
}

export function EventsManager({ events, onEventsChange, weekStart, onWeekChange }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [localEvents, setLocalEvents] = useState(events);
  const [isSyncingRbfa, setIsSyncingRbfa] = useState(false);
  const [rbfaMessage, setRbfaMessage] = useState(null);

  useEffect(() => {
    setLocalEvents(events);
  }, [events]);

  const weekEvents = useMemo(
    () => getEventsForWeek(localEvents, weekStart),
    [localEvents, weekStart]
  );

  function syncEvents(nextEvents) {
    const sorted = [...nextEvents].sort((a, b) => a.date.localeCompare(b.date));
    setLocalEvents(sorted);
    onEventsChange(sorted);
  }

  async function handleCreate(values) {
    const result = await createEvent(values);

    if (result.success) {
      syncEvents([...localEvents, result.event]);
      setShowAddForm(false);
    }

    return result;
  }

  function handleUpdated(updatedEvent) {
    syncEvents(
      localEvents.map((event) => (event.id === updatedEvent.id ? updatedEvent : event))
    );
  }

  function handleDeleted(eventId) {
    syncEvents(localEvents.filter((event) => event.id !== eventId));
  }

  async function handleRbfaSync() {
    setIsSyncingRbfa(true);
    setRbfaMessage(null);

    const result = await syncRbfaCalendarAction();

    if (result.success) {
      if (result.events) {
        syncEvents(result.events);
      }
      setRbfaMessage(
        `RBFA sync klaar: ${result.inserted} nieuw, ${result.updated} bijgewerkt, ${result.unchanged} ongewijzigd (${result.fetched} wedstrijden).`
      );
    } else {
      setRbfaMessage(result.error ?? "RBFA sync mislukt.");
    }

    setIsSyncingRbfa(false);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Agenda</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isSyncingRbfa}
            onClick={handleRbfaSync}
          >
            {isSyncingRbfa ? "RBFA synchroniseren…" : "RBFA kalender sync"}
          </Button>
          {!showAddForm && (
            <Button type="button" size="sm" onClick={() => setShowAddForm(true)}>
              Event toevoegen
            </Button>
          )}
        </div>
      </div>

      {rbfaMessage && (
        <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {rbfaMessage}
        </p>
      )}

      <WeekNavigator weekStart={weekStart} onWeekChange={onWeekChange} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Events deze week</CardTitle>
          <CardDescription>
            Trainingen manueel beheren; wedstrijden ook via RBFA sync (FC Hoje).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {showAddForm && (
            <EventForm
              submitLabel="Toevoegen"
              onSubmit={handleCreate}
              onCancel={() => setShowAddForm(false)}
            />
          )}

          {weekEvents.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Geen events deze week. Voeg er een toe of blader naar een andere week.
            </p>
          ) : (
            weekEvents.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
              />
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
