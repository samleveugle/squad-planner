import Link from "next/link";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { RoleViewSwitch } from "@/components/layout/RoleViewSwitch";
import { Button } from "@/components/ui/button";

export function Header({
  currentPlayer,
  showRoleSwitch,
  roleView,
  onRoleViewChange,
  isDemo = false,
}) {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-600">
            Squad Planner{isDemo ? " · Demo" : ""}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Voetbalkalender</h1>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex flex-wrap items-center gap-2">
            {showRoleSwitch && (
              <RoleViewSwitch value={roleView} onChange={onRoleViewChange} />
            )}
            <ThemeToggle />
            {isDemo ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/">Naar inloggen</Link>
              </Button>
            ) : (
              <LogoutButton />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {isDemo ? "Demo als" : "Ingelogd als"}{" "}
            <span className="font-medium text-foreground">
              {currentPlayer.name}
              {currentPlayer.isAdmin && currentPlayer.isSquadPlayer
                ? ""
                : currentPlayer.isAdmin
                  ? " (admin)"
                  : ""}
            </span>
          </p>
        </div>
      </div>
    </header>
  );
}
