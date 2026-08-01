import { gradientToCss, gradientsEqual } from "../../state/gradient";
import type { Background, GradientBackground } from "../../state/types";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { ColorField } from "./ColorField";

const COLORS = ["#15151a", "#27272a", "#3730a3", "#1d4ed8", "#047857", "#b45309"];

type GradientPreset = GradientBackground & {
  id: string;
  name: string;
};

const GRADIENTS: GradientPreset[] = [
  {
    id: "midnight",
    name: "Midnight",
    angle: 145,
    colors: ["#0b0f1a", "#1e293b", "#334155"],
    type: "gradient",
  },
  {
    id: "soft-slate",
    name: "Soft Slate",
    angle: 135,
    colors: ["#1e293b", "#475569", "#94a3b8"],
    type: "gradient",
  },
  {
    id: "indigo-haze",
    name: "Indigo Haze",
    angle: 140,
    colors: ["#1e1b4b", "#4338ca", "#818cf8"],
    type: "gradient",
  },
  {
    id: "ocean-mist",
    name: "Ocean Mist",
    angle: 135,
    colors: ["#0c4a6e", "#0284c7", "#7dd3fc"],
    type: "gradient",
  },
  {
    id: "sage",
    name: "Sage",
    angle: 135,
    colors: ["#14532d", "#3f6f4e", "#86a789"],
    type: "gradient",
  },
  {
    id: "warm-dusk",
    name: "Warm Dusk",
    angle: 145,
    colors: ["#4c1d1d", "#9a4a3a", "#d4a574"],
    type: "gradient",
  },
  {
    id: "lavender",
    name: "Lavender",
    angle: 135,
    colors: ["#2e1065", "#6d28d9", "#c4b5fd"],
    type: "gradient",
  },
  {
    id: "rose-smoke",
    name: "Rose Smoke",
    angle: 140,
    colors: ["#4a1942", "#9f5f7a", "#e8b4b8"],
    type: "gradient",
  },
  // Spotlight radials + deep linear from CSS sources
  {
    id: "azure-glow",
    name: "Azure Glow",
    type: "gradient",
    style: "radial",
    cx: 0.327,
    cy: 0.498,
    radius: "farthest-corner",
    colors: ["#1c58ee", "#002789"],
  },
  {
    id: "deep-indigo",
    name: "Deep Indigo",
    type: "gradient",
    style: "linear",
    angle: 111.4,
    colors: ["#070709", "#1b1871"],
    stops: [0.065, 0.932],
  },
  {
    id: "plum-void",
    name: "Plum Void",
    type: "gradient",
    style: "radial",
    cx: 0.1,
    cy: 0.2,
    radius: "farthest-corner",
    colors: ["#642b73", "#040004"],
    stops: [0, 0.9],
  },
];

function toBackground(gradient: GradientPreset): GradientBackground {
  const { id: _id, name: _name, ...background } = gradient;
  return background;
}

type CanvasPanelProps = {
  background: Background;
  onChange: (background: Background) => void;
};

export function CanvasPanel({ background, onChange }: CanvasPanelProps) {
  const customColor = background.type === "solid" ? background.color : background.colors[0];

  const isGradientSelected = (gradient: GradientPreset) =>
    background.type === "gradient" && gradientsEqual(background, toBackground(gradient));

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
        {GRADIENTS.map((gradient) => {
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
              onClick={() => onChange(toBackground(gradient))}
            />
          );
        })}
      </div>
    </>
  );
}
