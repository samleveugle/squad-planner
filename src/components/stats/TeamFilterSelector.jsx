"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const DEFAULT_TEAM_FILTER = "general";

export const TEAM_FILTERS = [
  { id: "general", label: "Algemeen" },
  { id: "trainings", label: "Trainingen" },
  { id: "matches", label: "Wedstrijden" },
  { id: "minutes", label: "Speelminuten" },
  { id: "goals", label: "Goals" },
  { id: "assists", label: "Assists" },
  { id: "yellowCards", label: "Gele kaarten" },
  { id: "redCards", label: "Rode kaarten" },
];

export function getTeamFilterLabel(filterId) {
  return TEAM_FILTERS.find((filter) => filter.id === filterId)?.label ?? "Algemeen";
}

export function TeamFilterSelector({ value, onChange, className }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className ?? "h-9 w-full min-w-[11rem] sm:w-44"}>
        <SelectValue placeholder="Kies filter" />
      </SelectTrigger>
      <SelectContent>
        {TEAM_FILTERS.map((filter) => (
          <SelectItem key={filter.id} value={filter.id}>
            {filter.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
