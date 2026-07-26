import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { ColorField } from "./ColorField";
import type { Background, GradientBackground } from "../../state/types";

const COLORS = ["#15151a", "#27272a", "#3730a3", "#1d4ed8", "#047857", "#b45309"];

type GradientPreset = GradientBackground & {
  id: string;
  name: string;
};

const GRADIENTS: GradientPreset[] = [
  {
    id: "violet-night",
    name: "Violet Night",
    angle: 135,
    colors: ["#312e81", "#7c3aed"],
    type: "gradient",
  },
  {
    id: "electric-blue",
    name: "Electric Blue",
    angle: 135,
    colors: ["#0f172a", "#2563eb"],
    type: "gradient",
  },
  { id: "ocean", name: "Ocean", angle: 135, colors: ["#0f766e", "#0891b2"], type: "gradient" },
  { id: "emerald", name: "Emerald", angle: 135, colors: ["#064e3b", "#10b981"], type: "gradient" },
  { id: "sunset", name: "Sunset", angle: 135, colors: ["#db2777", "#f97316"], type: "gradient" },
  { id: "ember", name: "Ember", angle: 135, colors: ["#7f1d1d", "#ea580c"], type: "gradient" },
  { id: "berry", name: "Berry", angle: 135, colors: ["#4c1d95", "#db2777"], type: "gradient" },
  { id: "aurora", name: "Aurora", angle: 120, colors: ["#4338ca", "#06b6d4"], type: "gradient" },
  {
    id: "midnight",
    name: "Midnight",
    angle: 135,
    colors: ["#020617", "#334155"],
    type: "gradient",
  },
  { id: "steel", name: "Steel", angle: 135, colors: ["#1e293b", "#64748b"], type: "gradient" },
  { id: "plum", name: "Plum", angle: 135, colors: ["#3b0764", "#a21caf"], type: "gradient" },
  { id: "lagoon", name: "Lagoon", angle: 120, colors: ["#164e63", "#14b8a6"], type: "gradient" },
];

type CanvasPanelProps = {
  background: Background;
  onChange: (background: Background) => void;
};

export function CanvasPanel({ background, onChange }: CanvasPanelProps) {
  const customColor = background.type === "solid" ? background.color : background.colors[0];

  const isGradientSelected = (gradient: GradientPreset) =>
    background.type === "gradient" &&
    background.angle === gradient.angle &&
    background.colors[0] === gradient.colors[0] &&
    background.colors[1] === gradient.colors[1];

  return (
    <>
      <Label>Solid colors</Label>
      <div className="studio-swatches">
        {COLORS.map((color) => (
          <Button
            variant="ghost"
            key={color}
            className={
              background.type === "solid" && background.color.toLowerCase() === color
                ? "selected"
                : ""
            }
            style={{ background: color }}
            aria-label={`Set background to ${color}`}
            aria-pressed={background.type === "solid" && background.color.toLowerCase() === color}
            onClick={() => onChange({ type: "solid", color })}
          />
        ))}
      </div>
      <ColorField
        label="Custom color"
        value={customColor}
        onChange={(color) => onChange({ type: "solid", color })}
      />
      <Label>Gradient presets</Label>
      <div className="studio-gradient-swatches">
        {GRADIENTS.map((gradient) => (
          <Button
            variant="ghost"
            key={gradient.id}
            className={isGradientSelected(gradient) ? "selected" : ""}
            style={{
              background: `linear-gradient(${gradient.angle}deg, ${gradient.colors[0]}, ${gradient.colors[1]})`,
            }}
            aria-label={`Use ${gradient.name} gradient`}
            aria-pressed={isGradientSelected(gradient)}
            title={gradient.name}
            onClick={() =>
              onChange({
                type: "gradient",
                angle: gradient.angle,
                colors: gradient.colors,
              })
            }
          />
        ))}
      </div>
    </>
  );
}
