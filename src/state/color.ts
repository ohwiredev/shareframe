/** Normalize hex input to the canonical color shape stored by the editor. */
export function normalizeHex(input: string): string | null {
  const raw = input.trim().toLowerCase();
  const value = raw.startsWith("#") ? raw : `#${raw}`;

  if (/^#[0-9a-f]{6}$/.test(value)) {
    return value;
  }

  const short = value.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/);
  if (!short) {
    return null;
  }

  return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
}
