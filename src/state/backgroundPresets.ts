/**
 * Solid background presets for OG images.
 * Hex values are canvas product colors (not UI chrome tokens).
 */
export type BackgroundPreset = {
  id: string;
  label: string;
  color: string;
};

export const BACKGROUND_PRESETS: readonly BackgroundPreset[] = [
  { id: "midnight", label: "Midnight", color: "#1a1a2e" },
  { id: "charcoal", label: "Charcoal", color: "#111827" },
  { id: "black", label: "Black", color: "#0a0a0a" },
  { id: "navy", label: "Navy", color: "#0f172a" },
  { id: "indigo", label: "Indigo", color: "#312e81" },
  { id: "purple", label: "Purple", color: "#4c1d95" },
  { id: "teal", label: "Teal", color: "#134e4a" },
  { id: "emerald", label: "Emerald", color: "#064e3b" },
  { id: "rose", label: "Rose", color: "#881337" },
  { id: "amber", label: "Amber", color: "#92400e" },
  { id: "slate", label: "Slate", color: "#334155" },
  { id: "sky", label: "Sky", color: "#0c4a6e" },
  { id: "wine", label: "Wine", color: "#4a044e" },
  { id: "forest", label: "Forest", color: "#14532d" },
  { id: "light", label: "Light", color: "#f8fafc" },
  { id: "mist", label: "Mist", color: "#e2e8f0" },
] as const;
