import type { Background, GradientBackground, SolidBackground } from "./types";

/** Named solid swatch used by the canvas panel and A/B colorways. */
export type SolidColorPreset = {
  id: string;
  name: string;
  color: string;
};

/** Named gradient swatch; extends canvas gradient background fields. */
export type GradientPreset = GradientBackground & {
  id: string;
  name: string;
};

/** Named background alternative (solid or gradient) for swatches and variants. */
export type ColorwayPreset = {
  id: string;
  name: string;
  background: Background;
};

/** Curated solid colors for the canvas panel. */
export const SOLID_COLOR_PRESETS: SolidColorPreset[] = [
  { id: "ink", name: "Ink", color: "#15151a" },
  { id: "zinc", name: "Zinc", color: "#27272a" },
  { id: "indigo", name: "Indigo", color: "#3730a3" },
  { id: "blue", name: "Blue", color: "#1d4ed8" },
  { id: "emerald", name: "Emerald", color: "#047857" },
  { id: "amber", name: "Amber", color: "#b45309" },
];

/** Curated gradient presets for the canvas panel. */
export const GRADIENT_PRESETS: GradientPreset[] = [
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
  // Brand: studio root → stage ambient → primary violet
  {
    id: "shareframe",
    name: "Shareframe",
    type: "gradient",
    style: "linear",
    angle: 135,
    colors: ["#0c0c0e", "#292550", "#695cff"],
    stops: [0, 0.48, 1],
  },
  {
    id: "shareframe-glow",
    name: "Shareframe Glow",
    type: "gradient",
    style: "radial",
    cx: 0.5,
    cy: 1.5,
    radius: "farthest-corner",
    colors: ["#887bff", "#695cff", "#0c0c0e"],
    stops: [0, 0.32, 0.88],
  },
];

/** Strip display metadata so the value can be stored as editor background state. */
export function solidPresetToBackground(
  preset: SolidColorPreset,
): SolidBackground {
  return { type: "solid", color: preset.color };
}

/** Strip display metadata so the value can be stored as editor background state. */
export function gradientPresetToBackground(
  preset: GradientPreset,
): GradientBackground {
  const { id: _id, name: _name, ...background } = preset;
  return background;
}

/**
 * All curated solid + gradient colorways.
 * Single source for canvas swatches and the variant A/B generator.
 */
export const BACKGROUND_COLORWAYS: ColorwayPreset[] = [
  ...SOLID_COLOR_PRESETS.map((preset) => ({
    id: preset.id,
    name: preset.name,
    background: solidPresetToBackground(preset),
  })),
  ...GRADIENT_PRESETS.map((preset) => ({
    id: preset.id,
    name: preset.name,
    background: gradientPresetToBackground(preset),
  })),
];
