import { Button } from "@/components/ui/button";
import { FORMATIONS } from "@/lib/formations";

export function FormationPicker({ value, onChange, disabled = false }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.keys(FORMATIONS).map((formationId) => (
        <Button
          key={formationId}
          type="button"
          size="sm"
          variant={value === formationId ? "default" : "outline"}
          disabled={disabled}
          onClick={() => onChange(formationId)}
        >
          {FORMATIONS[formationId].label}
        </Button>
      ))}
    </div>
  );
}
