import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RoleViewSwitch({ value, onChange }) {
  return (
    <div className="inline-flex rounded-lg bg-muted p-1">
      <Button
        type="button"
        size="sm"
        variant={value === "player" ? "default" : "ghost"}
        className={cn("h-8", value !== "player" && "hover:bg-background/60")}
        onClick={() => onChange("player")}
      >
        Speler
      </Button>
      <Button
        type="button"
        size="sm"
        variant={value === "admin" ? "default" : "ghost"}
        className={cn("h-8", value !== "admin" && "hover:bg-background/60")}
        onClick={() => onChange("admin")}
      >
        Admin
      </Button>
    </div>
  );
}
