import type { GradientBackground } from "./types";

/** Build a CSS background-image string that mirrors canvas gradient rendering. */
export function gradientToCss(background: GradientBackground): string {
  const colorStops = formatColorStops(background);

  if (background.style === "radial") {
    const cx = ((background.cx ?? 0.5) * 100).toFixed(1);
    const cy = ((background.cy ?? 0.5) * 100).toFixed(1);
    if (typeof background.radius === "number") {
      return `radial-gradient(circle ${background.radius}px at ${cx}% ${cy}%, ${colorStops})`;
    }
    return `radial-gradient(circle farthest-corner at ${cx}% ${cy}%, ${colorStops})`;
  }

  const angle = background.angle ?? 135;
  return `linear-gradient(${angle}deg, ${colorStops})`;
}

function formatColorStops(background: GradientBackground): string {
  return background.colors
    .map((color, i) => {
      const stop = background.stops?.[i];
      if (stop === undefined) return color;
      const pct = Math.min(100, Math.max(0, stop * 100));
      return `${color} ${Number(pct.toFixed(1))}%`;
    })
    .join(", ");
}

/** True when two gradient backgrounds describe the same fill. */
export function gradientsEqual(a: GradientBackground, b: GradientBackground): boolean {
  const styleA = a.style ?? "linear";
  const styleB = b.style ?? "linear";
  if (styleA !== styleB) return false;

  if (a.colors.length !== b.colors.length) return false;
  if (!a.colors.every((c, i) => c.toLowerCase() === b.colors[i].toLowerCase())) return false;

  const stopsA = a.stops;
  const stopsB = b.stops;
  if ((stopsA?.length ?? 0) !== (stopsB?.length ?? 0)) return false;
  if (stopsA && stopsB && !stopsA.every((s, i) => Math.abs(s - stopsB[i]) < 0.001)) {
    return false;
  }

  if (styleA === "radial") {
    return (
      Math.abs((a.cx ?? 0.5) - (b.cx ?? 0.5)) < 0.001 &&
      Math.abs((a.cy ?? 0.5) - (b.cy ?? 0.5)) < 0.001 &&
      String(a.radius ?? "farthest-corner") === String(b.radius ?? "farthest-corner")
    );
  }

  return Math.abs((a.angle ?? 135) - (b.angle ?? 135)) < 0.01;
}
