import {
  GRADIENT_PRESETS,
  SOLID_COLOR_PRESETS,
  gradientPresetToBackground,
  type GradientPreset,
} from "../../state/backgroundPresets";
import { gradientToCss, gradientsEqual } from "../../state/gradient";
import type { Background } from "../../state/types";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { ColorField } from "./ColorField";
import { PanelHeader } from "./PanelHeader";

type CanvasPanelProps = {
  background: Background;
  onChange: (background: Background) => void;
};

export function CanvasPanel({ background, onChange }: CanvasPanelProps) {
  const customColor =
    background.type === "solid" ? background.color : background.colors[0];

  const isGradientSelected = (gradient: GradientPreset) =>
    background.type === "gradient" &&
    gradientsEqual(background, gradientPresetToBackground(gradient));

  return (
    <>
      <PanelHeader
        title="Canvas"
        subtitle="Pick a solid color or curated gradient for the Open Graph canvas."
      />

      <Label className="panel-field-label">Solid colors</Label>
      <div className="studio-swatches">
        {SOLID_COLOR_PRESETS.map((preset) => {
          const selected =
            background.type === "solid" &&
            background.color.toLowerCase() === preset.color;
          return (
            <Button
              variant="ghost"
              key={preset.id}
              className={selected ? "selected" : ""}
              style={{ background: preset.color }}
              aria-label={`Set background to ${preset.name}`}
              aria-pressed={selected}
              title={preset.name}
              onClick={() => onChange({ type: "solid", color: preset.color })}
            />
          );
        })}
      </div>
      <ColorField
        label="Custom color"
        value={customColor}
        onChange={(color) => onChange({ type: "solid", color })}
      />
      <Label className="panel-field-label">Gradient presets</Label>
      <div className="studio-gradient-swatches">
        {GRADIENT_PRESETS.map((gradient) => {
          const selected = isGradientSelected(gradient);
          return (
            <Button
              variant="ghost"
              key={gradient.id}
              className={selected ? "selected" : ""}
              style={{ backgroundImage: gradientToCss(gradient) }}
              aria-label={`Use ${gradient.name} gradient`}
              aria-pressed={selected}
              title={gradient.name}
              onClick={() => onChange(gradientPresetToBackground(gradient))}
            />
          );
        })}
      </div>
    </>
  );
}
