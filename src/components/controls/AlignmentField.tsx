import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import { useId } from "react";
import type { HorizontalAlignment } from "../../state/types";
import { Button } from "../ui/button";
import { Label } from "../ui/label";

type AlignmentFieldProps = {
  value: HorizontalAlignment;
  disabled?: boolean;
  onChange: (value: HorizontalAlignment) => void;
};

const OPTIONS = [
  { value: "left", label: "Left", icon: AlignLeft },
  { value: "center", label: "Center", icon: AlignCenter },
  { value: "right", label: "Right", icon: AlignRight },
] as const;

export function AlignmentField({
  value,
  disabled,
  onChange,
}: AlignmentFieldProps) {
  const labelId = useId();

  return (
    <div className="studio-field">
      <Label id={labelId}>Alignment</Label>
      <div
        className="alignment-control"
        role="group"
        aria-labelledby={labelId}
      >
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <Button
              key={option.value}
              type="button"
              variant="outline"
              disabled={disabled}
              aria-label={`${option.label} align`}
              aria-pressed={value === option.value}
              onClick={() => onChange(option.value)}
            >
              <Icon />
              <span>{option.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
