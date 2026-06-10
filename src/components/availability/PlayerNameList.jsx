export function PlayerNameList({ players, emptyText }) {
  if (players.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <ul className="flex flex-wrap gap-1.5">
      {players.map((player) => (
        <li
          key={player.id}
          className="rounded-md border bg-background px-2 py-0.5 text-sm"
        >
          {player.name}
        </li>
      ))}
    </ul>
  );
}
