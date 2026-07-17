"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MAX_SHIRT_NUMBER, MIN_SHIRT_NUMBER } from "@/lib/lineups";

const EMPTY_VALUE = "__empty__";

export function ShirtNumberSelect({
  playerId,
  value,
  onChange,
  usedNumbers = new Set(),
  disabled = false,
}) {
  const isDisabled = disabled || !playerId;

  return (
    <Select
      value={value != null ? String(value) : EMPTY_VALUE}
      onValueChange={(nextValue) => {
        if (!playerId) {
          return;
        }

        onChange(playerId, nextValue === EMPTY_VALUE ? null : Number(nextValue));
      }}
      disabled={isDisabled}
    >
      <SelectTrigger className="h-8 w-16 shrink-0 text-xs">
        <SelectValue placeholder="#" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={EMPTY_VALUE}>—</SelectItem>
        {Array.from(
          { length: MAX_SHIRT_NUMBER - MIN_SHIRT_NUMBER + 1 },
          (_, index) => MIN_SHIRT_NUMBER + index
        ).map((number) => (
          <SelectItem
            key={number}
            value={String(number)}
            disabled={usedNumbers.has(number) && value !== number}
          >
            {number}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
