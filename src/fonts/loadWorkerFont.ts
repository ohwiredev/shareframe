import { findGoogleFontByStack, type GoogleFontOption } from "../state/fonts";

type WorkerFontScope = {
  fonts: FontFaceSet;
};

const workerFontCache = new Map<string, Promise<boolean>>();

function stylesheetHref(font: GoogleFontOption, weight: number): string {
  const family = font.family.replace(/ /g, "+");
  return `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&display=swap`;
}

function cssValue(block: string, property: string): string | undefined {
  return block.match(new RegExp(`${property}\\s*:\\s*([^;]+)`, "i"))?.[1]?.trim();
}

async function loadGoogleFace(
  scope: WorkerFontScope,
  font: GoogleFontOption,
  weight: number,
): Promise<boolean> {
  const response = await fetch(stylesheetHref(font, weight));
  if (!response.ok) {
    throw new Error(`Could not load ${font.family}.`);
  }

  const stylesheet = await response.text();
  const blocks = [...stylesheet.matchAll(/@font-face\s*{([^}]*)}/gi)];
  if (blocks.length === 0) {
    throw new Error(`No font faces were returned for ${font.family}.`);
  }

  const faces = blocks.flatMap((match) => {
    const block = match[1] ?? "";
    const source = cssValue(block, "src")?.match(/url\((['"]?)(.*?)\1\)/i)?.[2];
    if (!source) return [];

    const unicodeRange = cssValue(block, "unicode-range");
    return [
      new FontFace(font.family, `url("${source}")`, {
        weight: String(weight),
        ...(unicodeRange ? { unicodeRange } : {}),
      }),
    ];
  });

  const loaded = await Promise.all(faces.map((face) => face.load()));
  for (const face of loaded) {
    scope.fonts.add(face);
  }
  return loaded.length > 0;
}

export function ensureWorkerFontLoaded(
  scope: WorkerFontScope,
  stack: string,
  weight: number,
): Promise<boolean> {
  const google = findGoogleFontByStack(stack);
  if (!google) return Promise.resolve(true);

  const key = `${google.family}:${weight}`;
  const cached = workerFontCache.get(key);
  if (cached) return cached;

  const promise = loadGoogleFace(scope, google, weight).catch((error) => {
    workerFontCache.delete(key);
    console.warn(`[shareframe] Worker font load failed: ${key}`, error);
    return false;
  });
  workerFontCache.set(key, promise);
  return promise;
}
