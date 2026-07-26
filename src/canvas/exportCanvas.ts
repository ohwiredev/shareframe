export type ExportFormat = "png" | "jpg" | "webp";

const MIME: Record<ExportFormat, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

/**
 * Download the OG canvas as a file. Uses the same canvas element as the
 * live preview so export matches what the user sees.
 */
export function exportCanvas(
  canvas: HTMLCanvasElement,
  format: ExportFormat,
): void {
  const mimeType = MIME[format];
  const quality = format === "jpg" ? 0.92 : undefined;

  canvas.toBlob(
    (blob) => {
      if (!blob) {
        console.warn("[og-snap] Export failed: toBlob returned null");
        return;
      }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `ogsnap.${format}`;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      // Revoke after the download has a chance to start.
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    },
    mimeType,
    quality,
  );
}

/** Find the live OG preview canvas in the document. */
export function getOgCanvas(): HTMLCanvasElement | null {
  return document.querySelector<HTMLCanvasElement>("canvas.og-canvas");
}
