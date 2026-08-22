"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatSeasonLabel } from "@/lib/seasons";

export function SeasonSelector({
  seasonId,
  availableSeasonIds,
  onSeasonChange,
  className,
}) {
  const disabled = availableSeasonIds.length <= 1;

  return (
    <Select
      value={seasonId}
      onValueChange={onSeasonChange}
      disabled={disabled}
    >
      <SelectTrigger className={className ?? "h-9 w-full min-w-[11rem] sm:w-44"}>
        <SelectValue placeholder="Kies seizoen" />
      </SelectTrigger>
      <SelectContent>
        {availableSeasonIds.map((id) => (
          <SelectItem key={id} value={id}>
            {formatSeasonLabel(id)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
