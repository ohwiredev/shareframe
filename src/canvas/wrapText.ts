/**
 * Word-wrap helper for Canvas 2D text.
 * Returns lines that fit within maxWidth using the current ctx font.
 */
export function wrapText(
  ctx: Pick<CanvasRenderingContext2D, "measureText">,
  text: string,
  maxWidth: number,
): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return [];
  }

  const lines: string[] = [];

  for (const paragraph of normalized.split("\n")) {
    if (paragraph.length === 0) {
      lines.push("");
      continue;
    }

    const words = paragraph.split(/\s+/);
    let current = words[0] ?? "";

    for (let i = 1; i < words.length; i++) {
      const word = words[i]!;
      const next = `${current} ${word}`;
      if (ctx.measureText(next).width <= maxWidth) {
        current = next;
      } else {
        lines.push(current);
        current = word;
      }
    }

    lines.push(current);
  }

  return lines;
}
