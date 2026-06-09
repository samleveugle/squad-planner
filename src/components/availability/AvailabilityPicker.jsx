import { Button } from "@/components/ui/button";
import { AVAILABILITY } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const OPTIONS = ["present", "doubt", "absent"];

const activeStyles = {
  present: "bg-emerald-600 text-white hover:bg-emerald-600/90 border-emerald-600",
  doubt: "bg-amber-500 text-white hover:bg-amber-500/90 border-amber-500",
  absent: "bg-red-600 text-white hover:bg-red-600/90 border-red-600",
};

export function AvailabilityPicker({ value, onChange, disabled = false }) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((option) => (
        <Button
          key={option}
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className={cn(value === option && activeStyles[option])}
          onClick={() => onChange(option)}
        >
          {AVAILABILITY[option].label}
        </Button>
      ))}
    </div>
  );
}
