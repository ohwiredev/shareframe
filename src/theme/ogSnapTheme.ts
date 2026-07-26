import { defineTheme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral";

/**
 * OGSnap's product theme.
 *
 * Manrope carries the product identity and headings while Inter keeps the
 * dense editor controls compact and readable. The dark palette is deliberately
 * layered: body < panels < raised controls.
 */
export const ogSnapTheme = defineTheme({
  name: "og-snap",
  extends: neutralTheme,
  typography: {
    body: {
      family: "Inter",
      fallbacks: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    heading: {
      family: "Manrope",
      fallbacks: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      weight: "semibold",
    },
  },
  color: {
    accent: "#5B8CFF",
    neutralStyle: "cool",
    contrast: "standard",
  },
  radius: {
    base: 5,
    multiplier: 1,
  },
  tokens: {
    "--color-background-body": ["#F1F4F8", "#090B10"],
    "--color-background-surface": ["#FFFFFF", "#10131A"],
    "--color-background-card": ["#FFFFFF", "#151923"],
    "--color-background-popover": ["#FFFFFF", "#1A1F2B"],
    "--color-background-muted": ["#153A630A", "#FFFFFF08"],
    "--color-border": ["#153A6317", "#FFFFFF0D"],
    "--color-border-emphasized": ["#C5CEDA", "#303746"],
    "--color-text-primary": ["#111827", "#F1F4F8"],
    "--color-text-secondary": ["#526071", "#9DA7B7"],
    "--color-accent": ["#356EF2", "#6E98FF"],
    "--color-text-accent": ["#2458D3", "#9AB6FF"],
    "--color-icon-accent": ["#356EF2", "#7EA4FF"],
  },
  components: {
    "top-nav": {
      base: {
        backgroundColor: "var(--color-background-surface)",
        borderColor: "var(--color-border)",
      },
    },
    button: {
      base: {
        borderRadius: "var(--radius-element)",
      },
    },
    card: {
      base: {
        borderRadius: "var(--radius-container)",
      },
    },
  },
});
