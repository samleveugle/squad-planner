import { PlayerSelector } from "@/components/layout/PlayerSelector";

export function Header({ currentPlayer, onPlayerChange }) {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-600">Squad Planner</p>
          <h1 className="text-2xl font-bold tracking-tight">
            Voetbalkalender
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Geef aan wanneer je kan trainen en spelen.
          </p>
        </div>
        <PlayerSelector value={currentPlayer.id} onChange={onPlayerChange} />
      </div>
    </header>
  );
}
