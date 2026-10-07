import { cn } from "@/lib/utils";

export function PlayerNameList({ players, emptyText, lateAbsenceIds }) {
  if (players.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  const lateIds =
    lateAbsenceIds instanceof Set ? lateAbsenceIds : new Set(lateAbsenceIds ?? []);

  return (
    <ul className="flex flex-wrap gap-1.5">
      {players.map((player) => {
        const lateAbsent = lateIds.has(player.id);

        return (
          <li
            key={player.id}
            className={cn(
              "rounded-md border bg-background px-2 py-0.5 text-sm",
              lateAbsent &&
                "border-red-200 text-red-600 dark:border-red-900 dark:text-red-400"
            )}
          >
            {player.name}
          </li>
        );
      })}
    </ul>
  );
}
