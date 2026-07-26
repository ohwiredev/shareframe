/** Normalize user/hex input to `#rrggbb` lowercase, or null if invalid. */
export function normalizeHex(input: string): string | null {
  const raw = input.trim().toLowerCase();
  const withHash = raw.startsWith("#") ? raw : `#${raw}`;

  if (/^#[0-9a-f]{6}$/.test(withHash)) {
    return withHash;
  }

  // Expand #rgb → #rrggbb
  if (/^#[0-9a-f]{3}$/.test(withHash)) {
    const r = withHash[1]!;
    const g = withHash[2]!;
    const b = withHash[3]!;
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  return null;
}

/** Case-insensitive equality for hex colors (3- or 6-digit). */
export function hexEquals(a: string, b: string): boolean {
  const na = normalizeHex(a);
  const nb = normalizeHex(b);
  return na !== null && nb !== null && na === nb;
}
