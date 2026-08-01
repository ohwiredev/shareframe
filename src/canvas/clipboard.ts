import type { EditorState } from "../state/types";
import type { RenderPipeline } from "./renderPipeline";

export function isClipboardSupported(): boolean {
  return typeof navigator !== "undefined" && Boolean(navigator.clipboard?.write);
}

export async function copyImageToClipboard(
  pipeline: RenderPipeline,
  state: EditorState,
): Promise<void> {
  if (!isClipboardSupported()) {
    throw new Error("Clipboard API is not supported in this browser.");
  }

  const blob = await pipeline.export(state, "png");
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}
