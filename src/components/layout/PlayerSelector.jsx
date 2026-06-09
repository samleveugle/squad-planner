import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PLAYERS } from "@/lib/mock-data";

export function PlayerSelector({ value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="player-select" className="text-sm font-medium">
        Wie ben jij?
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="player-select" className="w-[220px]">
          <SelectValue placeholder="Kies een speler" />
        </SelectTrigger>
        <SelectContent>
          {PLAYERS.map((player) => (
            <SelectItem key={player.id} value={player.id}>
              {player.name}
              {player.isAdmin ? " (admin)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
