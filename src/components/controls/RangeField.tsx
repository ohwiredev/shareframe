import { useId, useRef, useState } from "react";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";

type RangeFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  display: string;
  onChange: (value: number) => void;
};

export function RangeField({
  label,
  value,
  min,
  max,
  step,
  disabled,
  display,
  onChange,
}: RangeFieldProps) {
  const id = useId();
  const [localValue, setLocalValue] = useState(value);
  const rafRef = useRef<number | null>(null);

  // Sync external value changes (e.g., template application, undo)
  if (Math.abs(localValue - value) > step * 0.5 && rafRef.current === null) {
    setLocalValue(value);
  }

  const handleChange = (nextValue: number) => {
    setLocalValue(nextValue);

    // Batch state updates to one per animation frame
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      onChange(nextValue);
    });
  };

  return (
    <div className="studio-range">
      <span>
        <Label htmlFor={id}>{label}</Label>
        <output>{display}</output>
      </span>
      <Slider
        id={id}
        value={localValue}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={(nextValue) => handleChange(nextValue as number)}
      />
    </div>
  );
}
