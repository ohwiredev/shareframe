import { ensureEditorFontsLoaded } from "../fonts/loadGoogleFont";
import { OG_HEIGHT, OG_WIDTH } from "../state/constants";
import type { EditorState } from "../state/types";
import { CONTEXT_OPTIONS, drawOgImage, type OgRenderingContext } from "./drawOgImage";
import type {
  ExportFormat,
  RenderBackend,
  RenderWorkerRequest,
  RenderWorkerResponse,
} from "./types";

export interface RenderPipeline {
  render(state: EditorState): void;
  export(state: EditorState, format: ExportFormat): Promise<Blob>;
  dispose(): void;
}

type RenderPipelineOptions = {
  backend?: RenderBackend;
  onError?: (error: Error) => void;
  onRendered?: (revision: number) => void;
};

type DecodedLogo = {
  source: CanvasImageSource;
  close: () => void;
};

type PendingExport = {
  resolve: (blob: Blob) => void;
  reject: (error: Error) => void;
};

function asError(value: unknown, fallback: string): Error {
  return value instanceof Error ? value : new Error(fallback);
}

function createHtmlContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d", CONTEXT_OPTIONS);
  if (!context) {
    throw new Error("Canvas 2D is unavailable in this browser.");
  }
  verifySrgbContext(context);
  return context;
}

function createOffscreenContext(canvas: OffscreenCanvas): OffscreenCanvasRenderingContext2D {
  const context = canvas.getContext("2d", CONTEXT_OPTIONS);
  if (!context) {
    throw new Error("Canvas 2D is unavailable in this browser.");
  }
  verifySrgbContext(context);
  return context;
}

function verifySrgbContext(context: OgRenderingContext): void {
  if (!("getContextAttributes" in context)) return;
  const attributes = context.getContextAttributes();
  if (attributes.colorSpace && attributes.colorSpace !== "srgb") {
    throw new Error("This browser could not create an sRGB canvas.");
  }
}

async function fetchImageBlobWithCorsFallback(src: string): Promise<Blob> {
  try {
    const response = await fetch(src, { mode: "cors" });
    if (response.ok) {
      return await response.blob();
    }
  } catch {
    // CORS or network error, proceed to proxy fallback
  }

  if (/^https?:\/\//i.test(src)) {
    const cleanUrl = src.replace(/^https?:\/\//i, "");
    const proxyUrls = [
      `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(src)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(src)}`,
    ];

    for (const proxyUrl of proxyUrls) {
      try {
        const res = await fetch(proxyUrl, { mode: "cors" });
        if (res.ok) {
          const blob = await res.blob();
          if (blob && blob.size > 0) return blob;
        }
      } catch {
        // Try next fallback proxy
      }
    }
  }

  throw new Error("The logo file could not be read.");
}

async function decodeImageBitmap(src: string): Promise<ImageBitmap> {
  const blob = await fetchImageBlobWithCorsFallback(src);
  const options: ImageBitmapOptions = {
    colorSpaceConversion: "default",
    imageOrientation: "from-image",
    premultiplyAlpha: "default",
  };

  try {
    return await createImageBitmap(blob, options);
  } catch (bitmapError) {
    const objectUrl = URL.createObjectURL(blob);
    try {
      const image = new Image();
      image.decoding = "async";
      image.src = objectUrl;
      await image.decode();
      return await createImageBitmap(image, options);
    } catch {
      throw asError(bitmapError, "The logo could not be decoded.");
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

async function decodeLogo(src: string): Promise<DecodedLogo> {
  if ("createImageBitmap" in window) {
    const bitmap = await decodeImageBitmap(src);
    return {
      source: bitmap,
      close: () => bitmap.close(),
    };
  }

  const blob = await fetchImageBlobWithCorsFallback(src);
  const objectUrl = URL.createObjectURL(blob);
  const image = new Image();
  image.decoding = "async";
  image.src = objectUrl;
  await image.decode();
  return {
    source: image,
    close: () => {
      URL.revokeObjectURL(objectUrl);
    },
  };
}

function mimeType(format: ExportFormat): string {
  if (format === "jpg") return "image/jpeg";
  return `image/${format}`;
}

function canvasToBlob(canvas: HTMLCanvasElement, format: ExportFormat): Promise<Blob> {
  const expectedType = mimeType(format);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("The browser returned no image data."));
        } else if (blob.type !== expectedType) {
          reject(new Error(`${format.toUpperCase()} encoding is unavailable in this browser.`));
        } else {
          resolve(blob);
        }
      },
      expectedType,
      format === "png" ? undefined : 0.92,
    );
  });
}

function supportsWorkerPipeline(): boolean {
  return (
    typeof Worker !== "undefined" &&
    typeof OffscreenCanvas !== "undefined" &&
    typeof createImageBitmap !== "undefined"
  );
}

class WorkerRenderPipeline implements RenderPipeline {
  private readonly canvas: HTMLCanvasElement;
  private readonly worker: Worker;
  private readonly previewContext: CanvasRenderingContext2D;
  private readonly pendingExports = new Map<number, PendingExport>();
  private readonly onError?: (error: Error) => void;
  private readonly onRendered?: (revision: number) => void;
  private latestState: EditorState | null = null;
  private revision = 0;
  private requestId = 0;
  private animationFrame: number | null = null;
  private logoSrc: string | null = null;
  private logoAssetId = 0;
  private logoPromise: Promise<number | null> = Promise.resolve(null);
  private overlaySrc: string | null = null;
  private overlayAssetId = 0;
  private overlayPromise: Promise<number | null> = Promise.resolve(null);
  private disposed = false;

  constructor(canvas: HTMLCanvasElement, options: RenderPipelineOptions) {
    this.canvas = canvas;
    this.previewContext = createHtmlContext(canvas);
    this.onError = options.onError;
    this.onRendered = options.onRendered;
    this.worker = new Worker(new URL("./render.worker.ts", import.meta.url), {
      type: "module",
      name: "shareframe-renderer",
    });
    this.worker.onmessage = (event: MessageEvent<RenderWorkerResponse>) => {
      this.handleWorkerMessage(event.data);
    };
    this.worker.onerror = (event) => {
      const error = new Error(event.message || "The render worker stopped.");
      this.failPendingExports(error);
      this.onError?.(error);
    };
    this.canvas.addEventListener("contextrestored", this.handleContextRestored);
  }

  render(state: EditorState): void {
    if (this.disposed) return;
    this.latestState = state;
    this.revision += 1;
    if (this.animationFrame !== null) return;

    this.animationFrame = requestAnimationFrame(() => {
      this.animationFrame = null;
      const revision = this.revision;
      const nextState = this.latestState;
      if (!nextState) return;

      void Promise.all([
        this.ensureLogo(nextState.logo.src),
        this.ensureOverlayImage(nextState.image?.src),
      ])
        .catch((error) => {
          this.onError?.(asError(error, "The image could not be decoded."));
          return [null, null] as const;
        })
        .then(([logoAssetId, overlayAssetId]) => {
          if (this.disposed || revision !== this.revision) return;
          this.post({
            type: "render",
            revision,
            state: nextState,
            logoAssetId,
            overlayAssetId,
          });
        });
    });
  }

  async export(state: EditorState, format: ExportFormat): Promise<Blob> {
    if (this.disposed) {
      throw new Error("The render pipeline has been closed.");
    }

    const [logoAssetId, overlayAssetId] = await Promise.all([
      this.ensureLogo(state.logo.src),
      this.ensureOverlayImage(state.image?.src),
    ]);
    const requestId = ++this.requestId;
    const result = new Promise<Blob>((resolve, reject) => {
      this.pendingExports.set(requestId, { resolve, reject });
    });
    this.post({
      type: "export",
      requestId,
      state,
      format,
      logoAssetId,
      overlayAssetId,
    });
    return result;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.canvas.removeEventListener("contextrestored", this.handleContextRestored);
    this.worker.terminate();
    this.failPendingExports(new Error("The render pipeline was closed."));
  }

  private readonly handleContextRestored = () => {
    if (this.latestState) this.render(this.latestState);
  };

  private post(message: RenderWorkerRequest, transfer: Transferable[] = []) {
    this.worker.postMessage(message, transfer);
  }

  private async ensureLogo(src: string | null): Promise<number | null> {
    if (src === this.logoSrc) return this.logoPromise;

    this.logoSrc = src;
    const assetId = ++this.logoAssetId;
    if (!src) {
      this.logoPromise = Promise.resolve(null);
      this.post({ type: "remove-logo", assetId });
      return null;
    }

    this.logoPromise = decodeImageBitmap(src).then((bitmap) => {
      if (this.disposed || assetId !== this.logoAssetId) {
        bitmap.close();
        return null;
      }
      this.post({ type: "set-logo", assetId, bitmap }, [bitmap]);
      return assetId;
    });
    return this.logoPromise;
  }

  private async ensureOverlayImage(src: string | null): Promise<number | null> {
    if (src === this.overlaySrc) return this.overlayPromise;

    this.overlaySrc = src;
    const assetId = ++this.overlayAssetId;
    if (!src) {
      this.overlayPromise = Promise.resolve(null);
      this.post({ type: "remove-overlay-image", assetId });
      return null;
    }

    this.overlayPromise = decodeImageBitmap(src).then((bitmap) => {
      if (this.disposed || assetId !== this.overlayAssetId) {
        bitmap.close();
        return null;
      }
      this.post({ type: "set-overlay-image", assetId, bitmap }, [bitmap]);
      return assetId;
    });
    return this.overlayPromise;
  }

  private handleWorkerMessage(message: RenderWorkerResponse): void {
    if (message.type === "frame") {
      if (message.revision < this.revision || this.disposed) {
        message.bitmap.close();
        return;
      }

      this.previewContext.drawImage(message.bitmap, 0, 0, OG_WIDTH, OG_HEIGHT);
      message.bitmap.close();
      this.canvas.dataset.renderRevision = String(message.revision);
      this.canvas.dataset.renderBackend = "worker";
      this.onRendered?.(message.revision);
      return;
    }

    if (message.type === "exported") {
      const pending = this.pendingExports.get(message.requestId);
      if (!pending) return;
      this.pendingExports.delete(message.requestId);
      pending.resolve(message.blob);
      return;
    }

    const error = new Error(message.message);
    if (message.requestId !== undefined) {
      const pending = this.pendingExports.get(message.requestId);
      if (pending) {
        this.pendingExports.delete(message.requestId);
        pending.reject(error);
        return;
      }
    }
    this.onError?.(error);
  }

  private failPendingExports(error: Error): void {
    for (const pending of this.pendingExports.values()) {
      pending.reject(error);
    }
    this.pendingExports.clear();
  }
}

class MainThreadRenderPipeline implements RenderPipeline {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly onError?: (error: Error) => void;
  private readonly onRendered?: (revision: number) => void;
  private latestState: EditorState | null = null;
  private revision = 0;
  private animationFrame: number | null = null;
  private logoSrc: string | null = null;
  private logoPromise: Promise<DecodedLogo | null> = Promise.resolve(null);
  private logo: DecodedLogo | null = null;
  private overlaySrc: string | null = null;
  private overlayPromise: Promise<DecodedLogo | null> = Promise.resolve(null);
  private overlay: DecodedLogo | null = null;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement, options: RenderPipelineOptions) {
    this.canvas = canvas;
    this.context = createHtmlContext(canvas);
    this.onError = options.onError;
    this.onRendered = options.onRendered;
    this.canvas.addEventListener("contextrestored", this.handleContextRestored);
  }

  render(state: EditorState): void {
    if (this.disposed) return;
    this.latestState = state;
    this.revision += 1;
    if (this.animationFrame !== null) return;

    this.animationFrame = requestAnimationFrame(() => {
      this.animationFrame = null;
      const revision = this.revision;
      const nextState = this.latestState;
      if (!nextState) return;

      void Promise.all([
        ensureEditorFontsLoaded([nextState.title.fontFamily, nextState.description.fontFamily]),
        this.ensureLogo(nextState.logo.src),
        this.ensureOverlayImage(nextState.image?.src),
      ])
        .then(([, logo, overlay]) => {
          if (this.disposed || revision !== this.revision) return;
          drawOgImage(this.context, nextState, {
            logoImage: logo?.source,
            overlayImage: overlay?.source,
          });
          this.canvas.dataset.renderRevision = String(revision);
          this.canvas.dataset.renderBackend = "main";
          this.onRendered?.(revision);
        })
        .catch((error) => {
          this.onError?.(asError(error, "The preview could not be rendered."));
        });
    });
  }

  async export(state: EditorState, format: ExportFormat): Promise<Blob> {
    if (this.disposed) {
      throw new Error("The render pipeline has been closed.");
    }

    const [, logo, overlay] = await Promise.all([
      ensureEditorFontsLoaded([state.title.fontFamily, state.description.fontFamily]),
      this.ensureLogo(state.logo.src),
      this.ensureOverlayImage(state.image?.src),
    ]);

    if (typeof OffscreenCanvas !== "undefined") {
      const canvas = new OffscreenCanvas(OG_WIDTH, OG_HEIGHT);
      const context = createOffscreenContext(canvas);
      drawOgImage(context, state, {
        logoImage: logo?.source,
        overlayImage: overlay?.source,
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

    const canvas = document.createElement("canvas");
    canvas.width = OG_WIDTH;
    canvas.height = OG_HEIGHT;
    const context = createHtmlContext(canvas);
    drawOgImage(context, state, {
      logoImage: logo?.source,
      overlayImage: overlay?.source,
    });
    return canvasToBlob(canvas, format);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.canvas.removeEventListener("contextrestored", this.handleContextRestored);
    this.logo?.close();
    this.logo = null;
    this.overlay?.close();
    this.overlay = null;
  }

  private readonly handleContextRestored = () => {
    if (this.latestState) this.render(this.latestState);
  };

  private async ensureLogo(src: string | null): Promise<DecodedLogo | null> {
    if (src === this.logoSrc) return this.logoPromise;

    this.logoSrc = src;
    this.logo?.close();
    this.logo = null;
    if (!src) {
      this.logoPromise = Promise.resolve(null);
      return null;
    }

    const expectedSrc = src;
    this.logoPromise = decodeLogo(src).then((logo) => {
      if (this.disposed || this.logoSrc !== expectedSrc) {
        logo.close();
        return null;
      }
      this.logo = logo;
      return logo;
    });
    return this.logoPromise;
  }

  private async ensureOverlayImage(src: string | null): Promise<DecodedLogo | null> {
    if (src === this.overlaySrc) return this.overlayPromise;

    this.overlaySrc = src;
    this.overlay?.close();
    this.overlay = null;
    if (!src) {
      this.overlayPromise = Promise.resolve(null);
      return null;
    }

    const expectedSrc = src;
    this.overlayPromise = decodeLogo(src).then((overlay) => {
      if (this.disposed || this.overlaySrc !== expectedSrc) {
        overlay.close();
        return null;
      }
      this.overlay = overlay;
      return overlay;
    });
    return this.overlayPromise;
  }
}

export function createRenderPipeline(
  canvas: HTMLCanvasElement,
  options: RenderPipelineOptions = {},
): RenderPipeline {
  const backend = options.backend ?? "auto";
  if (backend === "worker" && !supportsWorkerPipeline()) {
    throw new Error("The worker canvas pipeline is unavailable.");
  }

  return backend !== "main" && supportsWorkerPipeline()
    ? new WorkerRenderPipeline(canvas, options)
    : new MainThreadRenderPipeline(canvas, options);
}
