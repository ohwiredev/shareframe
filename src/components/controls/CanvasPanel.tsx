import {
  GRADIENT_PRESETS,
  type GradientPreset,
  gradientPresetToBackground,
  SOLID_COLOR_PRESETS,
} from "../../state/backgroundPresets";
import { gradientsEqual, gradientToCss } from "../../state/gradient";
import type { Background, SafeAreaConfig } from "../../state/types";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { ColorField } from "./ColorField";
import { PanelHeader } from "./PanelHeader";
import { RangeField } from "./RangeField";

type CanvasPanelProps = {
  background: Background;
  safeArea?: SafeAreaConfig;
  onChange: (background: Background) => void;
  onSafeAreaChange?: (safeArea: SafeAreaConfig) => void;
};

export function CanvasPanel({
  background,
  safeArea,
  onChange,
  onSafeAreaChange,
}: CanvasPanelProps) {
  const customColor = background.type === "solid" ? background.color : background.colors[0];

  const isGradientSelected = (gradient: GradientPreset) =>
    background.type === "gradient" &&
    gradientsEqual(background, gradientPresetToBackground(gradient));

  const currentSafeArea: SafeAreaConfig = {
    left: safeArea?.left ?? 80,
    right: safeArea?.right ?? 80,
    top: safeArea?.top ?? 60,
    bottom: safeArea?.bottom ?? 60,
  };

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
            background.type === "solid" && background.color.toLowerCase() === preset.color;
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

      {onSafeAreaChange && (
        <>
          <Separator className="section-rule" />
          <PanelHeader
            title="Safe Area Constraints"
            subtitle="Adjust outer margins and canvas safe area boundaries."
          />
          <RangeField
            label="Left & Right Padding (px)"
            value={currentSafeArea.left ?? 80}
            min={20}
            max={200}
            step={5}
            display={`${currentSafeArea.left ?? 80}px`}
            onChange={(val) =>
              onSafeAreaChange({
                ...currentSafeArea,
                left: val,
                right: val,
              })
            }
          />
          <RangeField
            label="Top & Bottom Padding (px)"
            value={currentSafeArea.top ?? 60}
            min={20}
            max={180}
            step={5}
            display={`${currentSafeArea.top ?? 60}px`}
            onChange={(val) =>
              onSafeAreaChange({
                ...currentSafeArea,
                top: val,
                bottom: val,
              })
            }
          />
        </>
      )}
    </>
  );
}
