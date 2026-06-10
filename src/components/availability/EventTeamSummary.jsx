import { AvailabilityBadge } from "@/components/availability/AvailabilityBadge";
import { PlayerNameList } from "@/components/availability/PlayerNameList";
import { AVAILABILITY, getEventResponseSummary } from "@/lib/mock-data";

export function EventTeamSummary({ eventId, responses, currentPlayerId }) {
  const { present, doubt, absent, unanswered } = getEventResponseSummary(
    eventId,
    responses
  );
  const respondedCount = present.length + doubt.length + absent.length;
  const totalPlayers = respondedCount + unanswered.length;

  return (
    <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Live overzicht ploeg</p>
        <p className="text-xs text-muted-foreground">
          {respondedCount}/{totalPlayers} gereageerd
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Zie direct wie er al aanwezig of afwezig is — updates live zodra iemand
        antwoordt.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AvailabilityBadge status="present" />
            <span className="text-xs text-muted-foreground">
              {present.length}
            </span>
          </div>
          <PlayerNameList
            players={present}
            emptyText="Nog niemand aanwezig."
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AvailabilityBadge status="doubt" />
            <span className="text-xs text-muted-foreground">{doubt.length}</span>
          </div>
          <PlayerNameList players={doubt} emptyText="Niemand twijfelt." />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AvailabilityBadge status="absent" />
            <span className="text-xs text-muted-foreground">
              {absent.length}
            </span>
          </div>
          <PlayerNameList players={absent} emptyText="Nog niemand afwezig." />
        </div>
      </div>

      {unanswered.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {unanswered.length} speler{unanswered.length === 1 ? "" : "s"} nog
          zonder antwoord
          {currentPlayerId &&
          unanswered.some((player) => player.id === currentPlayerId)
            ? " (jij ook nog niet)"
            : ""}
          .
        </p>
      )}

      <p className="text-xs font-medium text-muted-foreground">
        {AVAILABILITY.present.label}: {present.length} ·{" "}
        {AVAILABILITY.doubt.label}: {doubt.length} ·{" "}
        {AVAILABILITY.absent.label}: {absent.length}
      </p>
    </div>
  );
}
