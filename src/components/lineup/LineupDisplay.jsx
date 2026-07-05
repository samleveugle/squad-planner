import { LineupBenchStaff } from "@/components/lineup/LineupBenchStaff";
import { LineupField } from "@/components/lineup/LineupField";

export function LineupDisplay({
  formationId,
  positions,
  bench = [],
  staff = [],
  compact = false,
  highlightPlayerId = null,
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-center">
      <div className="w-full lg:flex-1 lg:max-w-md">
        <LineupField
          formationId={formationId}
          positions={positions}
          compact={compact}
          highlightPlayerId={highlightPlayerId}
        />
      </div>
      <div className="w-full rounded-lg border bg-background/80 p-3 lg:w-44 lg:shrink-0">
        <LineupBenchStaff
          bench={bench}
          staff={staff}
          highlightPlayerId={highlightPlayerId}
        />
      </div>
    </div>
  );
}
