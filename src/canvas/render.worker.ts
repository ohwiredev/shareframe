/// <reference lib="webworker" />

import {
  CONTEXT_OPTIONS,
  drawOgImage,
  type OgRenderingContext,
} from "./drawOgImage";
import type {
  ExportFormat,
  RenderWorkerRequest,
  RenderWorkerResponse,
} from "./types";
import { ensureWorkerFontLoaded } from "../fonts/loadWorkerFont";
import { OG_HEIGHT, OG_WIDTH } from "../state/constants";
import type { EditorState } from "../state/types";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const previewCanvas = new OffscreenCanvas(OG_WIDTH, OG_HEIGHT);
const maybePreviewContext = previewCanvas.getContext("2d", CONTEXT_OPTIONS);

if (!maybePreviewContext) {
  throw new Error("Canvas 2D is unavailable in the render worker.");
}
const previewContext: OffscreenCanvasRenderingContext2D = maybePreviewContext;

let logoBitmap: ImageBitmap | null = null;
let logoAssetId: number | null = null;
let latestRevision = 0;

function post(message: RenderWorkerResponse, transfer: Transferable[] = []) {
  scope.postMessage(message, transfer);
}

async function ensureFonts(state: EditorState): Promise<void> {
  await Promise.all([
    ensureWorkerFontLoaded(scope, state.title.fontFamily, state.title.fontWeight),
    ensureWorkerFontLoaded(
      scope,
      state.description.fontFamily,
      state.description.fontWeight,
    ),
  ]);
}

function matchingLogo(assetId: number | null): ImageBitmap | null {
  return assetId !== null && assetId === logoAssetId ? logoBitmap : null;
}

function mimeType(format: ExportFormat): string {
  if (format === "jpg") return "image/jpeg";
  return `image/${format}`;
}

async function renderPreview(
  state: EditorState,
  revision: number,
  assetId: number | null,
): Promise<void> {
  latestRevision = Math.max(latestRevision, revision);
  await ensureFonts(state);
  if (revision !== latestRevision) return;

  drawOgImage(previewContext, state, {
    logoImage: matchingLogo(assetId),
  });
  const bitmap = previewCanvas.transferToImageBitmap();
  post({ type: "frame", revision, bitmap }, [bitmap]);
}

async function renderExport(
  state: EditorState,
  format: ExportFormat,
  assetId: number | null,
): Promise<Blob> {
  await ensureFonts(state);
  const canvas = new OffscreenCanvas(OG_WIDTH, OG_HEIGHT);
  const context = canvas.getContext("2d", CONTEXT_OPTIONS);
  if (!context) {
    throw new Error("Could not create the export canvas.");
  }

  drawOgImage(context as OgRenderingContext, state, {
    logoImage: matchingLogo(assetId),
  });
  const expectedType = mimeType(format);
  const blob = await canvas.convertToBlob({
    type: expectedType,
    quality: format === "png" ? undefined : 0.92,
  });
  if (blob.type !== expectedType) {
    throw new Error(`${format.toUpperCase()} encoding is unavailable in this browser.`);
  }
  return blob;
}

scope.onmessage = (event: MessageEvent<RenderWorkerRequest>) => {
  const message = event.data;

  if (message.type === "set-logo") {
    logoBitmap?.close();
    logoBitmap = message.bitmap;
    logoAssetId = message.assetId;
    return;
  }

  if (message.type === "remove-logo") {
    logoBitmap?.close();
    logoBitmap = null;
    logoAssetId = message.assetId;
    return;
  }

  if (message.type === "render") {
    latestRevision = Math.max(latestRevision, message.revision);
    void renderPreview(
      message.state,
      message.revision,
      message.logoAssetId,
    ).catch((error) => {
      post({
        type: "error",
        message:
          error instanceof Error ? error.message : "The preview could not be rendered.",
      });
    });
    return;
  }

  void renderExport(
    message.state,
    message.format,
    message.logoAssetId,
  )
    .then((blob) => {
      post({ type: "exported", requestId: message.requestId, blob });
    })
    .catch((error) => {
      post({
        type: "error",
        requestId: message.requestId,
        message:
          error instanceof Error ? error.message : "The image could not be exported.",
      });
    });
};
