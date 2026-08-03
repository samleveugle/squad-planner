import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EventTypeToggle({ value, onChange }) {
  return (
    <div className="inline-flex rounded-lg bg-muted p-1">
      <Button
        type="button"
        size="sm"
        variant={value === "training" ? "default" : "ghost"}
        className={cn("h-8", value !== "training" && "hover:bg-background/60")}
        onClick={() => onChange("training")}
      >
        Training
      </Button>
      <Button
        type="button"
        size="sm"
        variant={value === "match" ? "default" : "ghost"}
        className={cn("h-8", value !== "match" && "hover:bg-background/60")}
        onClick={() => onChange("match")}
      >
        Wedstrijd
      </Button>
    </div>
  );
}
