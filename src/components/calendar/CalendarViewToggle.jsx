import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CalendarViewToggle({ value, onChange }) {
  return (
    <div className="inline-flex rounded-lg bg-muted p-1">
      <Button
        type="button"
        size="sm"
        variant={value === "week" ? "default" : "ghost"}
        className={cn("h-8", value !== "week" && "hover:bg-background/60")}
        onClick={() => onChange("week")}
      >
        Week
      </Button>
      <Button
        type="button"
        size="sm"
        variant={value === "month" ? "default" : "ghost"}
        className={cn("h-8", value !== "month" && "hover:bg-background/60")}
        onClick={() => onChange("month")}
      >
        Maand
      </Button>
    </div>
  );
}
