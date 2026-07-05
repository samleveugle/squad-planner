import { PlayerSelector } from "@/components/layout/PlayerSelector";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function Header({ currentPlayer, onPlayerChange }) {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-600">Squad Planner</p>
          <h1 className="text-2xl font-bold tracking-tight">Voetbalkalender</h1>
        </div>
        <div className="flex items-end gap-2">
          <ThemeToggle />
          <PlayerSelector value={currentPlayer.id} onChange={onPlayerChange} />
        </div>
      </div>
    </header>
  );
}
