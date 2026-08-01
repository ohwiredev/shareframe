import type { Background, EditorState, GradientBackground } from "../state/types";
import { gradientsEqual } from "../state/gradient";

/** A/B copy length buckets for social tests. */
export type CopyLength = "short" | "original" | "long";

/** Named background alternative that keeps layout identical. */
export type ColorwayPreset = {
  id: string;
  name: string;
  background: Background;
};

/** One concrete OG variant ready to preview or export. */
export type OgVariant = {
  id: string;
  label: string;
  fileSlug: string;
  colorwayId: string;
  colorwayName: string;
  copyLength: CopyLength;
  state: EditorState;
};

export type CustomCopy = {
  title: string;
  description: string;
};

export type VariantCopyOverrides = Partial<Record<CopyLength, CustomCopy>>;

/** Curated solid + gradient colorways for A/B background tests. */
export const VARIANT_COLORWAYS: ColorwayPreset[] = [
  { id: "ink", name: "Ink", background: { type: "solid", color: "#15151a" } },
  { id: "zinc", name: "Zinc", background: { type: "solid", color: "#27272a" } },
  { id: "indigo", name: "Indigo", background: { type: "solid", color: "#3730a3" } },
  { id: "blue", name: "Blue", background: { type: "solid", color: "#1d4ed8" } },
  { id: "emerald", name: "Emerald", background: { type: "solid", color: "#047857" } },
  { id: "amber", name: "Amber", background: { type: "solid", color: "#b45309" } },
  {
    id: "midnight",
    name: "Midnight",
    background: {
      type: "gradient",
      angle: 145,
      colors: ["#0b0f1a", "#1e293b", "#334155"],
    },
  },
  {
    id: "indigo-haze",
    name: "Indigo Haze",
    background: {
      type: "gradient",
      angle: 140,
      colors: ["#1e1b4b", "#4338ca", "#818cf8"],
    },
  },
  {
    id: "ocean-mist",
    name: "Ocean Mist",
    background: {
      type: "gradient",
      angle: 135,
      colors: ["#0c4a6e", "#0284c7", "#7dd3fc"],
    },
  },
  {
    id: "warm-dusk",
    name: "Warm Dusk",
    background: {
      type: "gradient",
      angle: 145,
      colors: ["#4c1d1d", "#9a4a3a", "#d4a574"],
    },
  },
  {
    id: "lavender",
    name: "Lavender",
    background: {
      type: "gradient",
      angle: 135,
      colors: ["#2e1065", "#6d28d9", "#c4b5fd"],
    },
  },
  {
    id: "azure-glow",
    name: "Azure Glow",
    background: {
      type: "gradient",
      style: "radial",
      cx: 0.327,
      cy: 0.498,
      radius: "farthest-corner",
      colors: ["#1c58ee", "#002789"],
    },
  },
];

const COPY_LABELS: Record<CopyLength, string> = {
  short: "Short",
  original: "Original",
  long: "Long",
};

/** Truncate at a word boundary when possible; append ellipsis when cut. */
export function truncateAtWord(text: string, maxLen: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;

  const slice = trimmed.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > Math.floor(maxLen * 0.55) ? lastSpace : maxLen;
  return `${slice.slice(0, cut).trimEnd()}…`;
}

/**
 * Build short / original / long copy from the current editor text.
 * Short is word-truncated; long keeps full copy (edit in UI for longer A/B lines).
 */
export function deriveCopyVariants(
  title: string,
  description: string,
): Record<CopyLength, CustomCopy> {
  return {
    short: {
      title: truncateAtWord(title, 42),
      description: truncateAtWord(description, 90),
    },
    original: {
      title,
      description,
    },
    long: {
      title,
      description,
    },
  };
}

export function backgroundsEqual(a: Background, b: Background): boolean {
  if (a.type !== b.type) return false;
  if (a.type === "solid" && b.type === "solid") {
    return a.color.toLowerCase() === b.color.toLowerCase();
  }
  if (a.type === "gradient" && b.type === "gradient") {
    return gradientsEqual(a, b as GradientBackground);
  }
  return false;
}

/** Find a curated colorway matching the background, or synthesize a "Current" one. */
export function resolveCurrentColorway(background: Background): ColorwayPreset {
  const match = VARIANT_COLORWAYS.find((c) => backgroundsEqual(c.background, background));
  if (match) return match;
  return {
    id: "current",
    name: "Current",
    background,
  };
}

/** Default colorway ids to pre-select for a fresh A/B set (includes current). */
export function defaultColorwayIds(background: Background): string[] {
  const current = resolveCurrentColorway(background);
  const extras = VARIANT_COLORWAYS.filter(
    (c) => c.id !== current.id && !backgroundsEqual(c.background, background),
  )
    .slice(0, 3)
    .map((c) => c.id);

  const ids = new Set<string>([current.id, ...extras]);
  return Array.from(ids);
}

/**
 * Cartesian product of selected colorways × copy lengths over a fixed layout.
 * Layout (logo, fonts, alignment, overlay) is preserved; only bg + text content change.
 */
export function generateVariants(
  base: EditorState,
  colorways: ColorwayPreset[],
  copyLengths: CopyLength[],
  copyOverrides: VariantCopyOverrides = {},
): OgVariant[] {
  if (colorways.length === 0 || copyLengths.length === 0) return [];

  const derived = deriveCopyVariants(base.title.content, base.description.content);
  const variants: OgVariant[] = [];

  for (const colorway of colorways) {
    for (const length of copyLengths) {
      const copy = copyOverrides[length] ?? derived[length];
      const multiColor = colorways.length > 1;
      const multiCopy = copyLengths.length > 1;

      let label = "Variant";
      if (multiColor && multiCopy) {
        label = `${colorway.name} · ${COPY_LABELS[length]}`;
      } else if (multiColor) {
        label = colorway.name;
      } else if (multiCopy) {
        label = COPY_LABELS[length];
      } else {
        label = `${colorway.name} · ${COPY_LABELS[length]}`;
      }

      const fileSlug = slugify(`${colorway.id}-${length}`);

      variants.push({
        id: `${colorway.id}__${length}`,
        label,
        fileSlug,
        colorwayId: colorway.id,
        colorwayName: colorway.name,
        copyLength: length,
        state: {
          ...base,
          background: colorway.background,
          title: {
            ...base.title,
            content: copy.title,
          },
          description: {
            ...base.description,
            content: copy.description,
          },
        },
      });
    }
  }

  return variants;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
