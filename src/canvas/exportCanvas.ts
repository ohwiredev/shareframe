import type { EditorState } from "../state/types";
import type { RenderPipeline } from "./renderPipeline";
import type { ExportFormat } from "./types";

export type { ExportFormat } from "./types";

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export async function exportImage(
  pipeline: RenderPipeline,
  state: EditorState,
  format: ExportFormat,
): Promise<void> {
  const fileName = `shareframe.${format}`;
  const blob = await pipeline.export(state, format);
  downloadBlob(blob, fileName);
}
