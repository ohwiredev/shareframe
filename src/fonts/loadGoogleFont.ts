import {
  findGoogleFontByStack,
  GOOGLE_FONT_WEIGHTS,
  type GoogleFontOption,
} from "../state/fonts";

/** In-flight / completed loads keyed by Google family name. */
const loadCache = new Map<string, Promise<void>>();

function stylesheetHref(font: GoogleFontOption): string {
  const familyParam = font.family.replace(/ /g, "+");
  const weights = GOOGLE_FONT_WEIGHTS.join(";");
  return `https://fonts.googleapis.com/css2?family=${familyParam}:wght@${weights}&display=swap`;
}

function findExistingLink(family: string): HTMLLinkElement | null {
  const links = document.querySelectorAll<HTMLLinkElement>(
    "link[data-og-google-font]",
  );
  for (const link of links) {
    if (link.dataset.ogGoogleFont === family) {
      return link;
    }
  }
  return null;
}

function injectStylesheet(font: GoogleFontOption): Promise<void> {
  const existing = findExistingLink(font.family);
  if (existing) {
    if (existing.dataset.loaded === "true") {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () =>
          reject(new Error(`Failed to load font stylesheet: ${font.family}`)),
        { once: true },
      );
    });
  }

  const href = stylesheetHref(font);

  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.ogGoogleFont = font.family;
    link.onload = () => {
      link.dataset.loaded = "true";
      resolve();
    };
    link.onerror = () => {
      reject(new Error(`Failed to load font stylesheet: ${font.family}`));
    };
    document.head.appendChild(link);
  });
}

async function loadFamilyFaces(font: GoogleFontOption): Promise<void> {
  await injectStylesheet(font);

  // Warm the faces canvas will use so drawText isn't measuring with fallbacks.
  const family = font.family;
  await Promise.all(
    GOOGLE_FONT_WEIGHTS.map((weight) =>
      document.fonts.load(`${weight} 64px "${family}"`).then(() => undefined),
    ),
  );
}

/**
 * Ensure a Google Font stack is loaded for canvas + UI.
 * System stacks resolve immediately. Concurrent calls share one promise.
 */
export function ensureFontLoaded(stack: string): Promise<void> {
  const google = findGoogleFontByStack(stack);
  if (!google) {
    return Promise.resolve();
  }

  const cached = loadCache.get(google.family);
  if (cached) {
    return cached;
  }

  const promise = loadFamilyFaces(google).catch((err) => {
    // Allow retry on next selection.
    loadCache.delete(google.family);
    console.warn(`[og-snap] Google Font load failed: ${google.family}`, err);
  });

  loadCache.set(google.family, promise);
  return promise;
}

/** Load every stack used by the current editor text styles. */
export function ensureEditorFontsLoaded(
  stacks: readonly string[],
): Promise<void> {
  const unique = [...new Set(stacks.filter(Boolean))];
  return Promise.all(unique.map((stack) => ensureFontLoaded(stack))).then(
    () => undefined,
  );
}
