import { useId } from "react";
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

  return (
    <div className="studio-range">
      <span>
        <Label htmlFor={id}>{label}</Label>
        <output>{display}</output>
      </span>
      <Slider
        id={id}
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={(nextValue) => onChange(nextValue as number)}
      />
    </div>
  );
}
