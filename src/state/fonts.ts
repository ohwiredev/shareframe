/**
 * Font options for title/description selectors.
 * System stacks work offline; Google Fonts load on demand via `loadGoogleFont`.
 */

export type FontOption = {
  /** Unique id for selection (stable across stack tweaks). */
  id: string;
  label: string;
  /** CSS font-family used on the canvas. */
  stack: string;
};

/** Google Font with the family name used by fonts.googleapis.com. */
export type GoogleFontOption = FontOption & {
  /** Exact family name for the CSS API (e.g. "Open Sans"). */
  family: string;
};

export const SYSTEM_FONTS: FontOption[] = [
  { id: "system-ui", label: "System UI", stack: "system-ui, sans-serif" },
  { id: "arial", label: "Arial", stack: "Arial, Helvetica, sans-serif" },
  {
    id: "helvetica",
    label: "Helvetica",
    stack: "Helvetica, Arial, sans-serif",
  },
  {
    id: "verdana",
    label: "Verdana",
    stack: "Verdana, Geneva, sans-serif",
  },
  {
    id: "trebuchet",
    label: "Trebuchet MS",
    stack: '"Trebuchet MS", Helvetica, sans-serif',
  },
  {
    id: "georgia",
    label: "Georgia",
    stack: 'Georgia, "Times New Roman", serif',
  },
  {
    id: "times",
    label: "Times New Roman",
    stack: '"Times New Roman", Times, serif',
  },
  {
    id: "courier",
    label: "Courier New",
    stack: '"Courier New", Courier, monospace',
  },
  {
    id: "mono",
    label: "System Mono",
    stack: "ui-monospace, Consolas, monospace",
  },
];

function googleFont(family: string, label: string = family): GoogleFontOption {
  const quoted = family.includes(" ") ? `"${family}"` : family;
  return {
    id: `g-${family.toLowerCase().replace(/\s+/g, "-")}`,
    label,
    family,
    stack: `${quoted}, system-ui, sans-serif`,
  };
}

/** Curated Google Fonts useful for social / OG titles. */
export const GOOGLE_FONTS: GoogleFontOption[] = [
  googleFont("Inter"),
  googleFont("Roboto"),
  googleFont("Open Sans"),
  googleFont("Lato"),
  googleFont("Montserrat"),
  googleFont("Poppins"),
  googleFont("Raleway"),
  googleFont("Nunito"),
  googleFont("Source Sans 3"),
  googleFont("Oswald"),
  googleFont("Playfair Display"),
  googleFont("Merriweather"),
  googleFont("Space Grotesk"),
  googleFont("DM Sans"),
  googleFont("Work Sans"),
  googleFont("Rubik"),
  googleFont("Fira Sans"),
  googleFont("Ubuntu"),
  googleFont("Noto Sans"),
  googleFont("Bebas Neue"),
  googleFont("Archivo"),
  googleFont("Manrope"),
  googleFont("Outfit"),
  googleFont("Sora"),
  googleFont("Josefin Sans"),
];

export function findGoogleFontByStack(
  stack: string,
): GoogleFontOption | undefined {
  return GOOGLE_FONTS.find((f) => f.stack === stack);
}

type FontWeightOption = {
  weight: number;
};

const FONT_WEIGHTS: FontWeightOption[] = [
  { weight: 400 },
  { weight: 500 },
  { weight: 600 },
  { weight: 700 },
];

/** Weights requested from Google Fonts CSS. */
export const GOOGLE_FONT_WEIGHTS = FONT_WEIGHTS.map((w) => w.weight);
