import type { EditorState } from "../state/types";

export type ExportFormat = "png" | "jpg" | "webp";
export type RenderBackend = "auto" | "worker" | "main";

export type RenderWorkerRequest =
  | { type: "set-logo"; assetId: number; bitmap: ImageBitmap }
  | { type: "remove-logo"; assetId: number }
  | { type: "set-overlay-image"; assetId: number; bitmap: ImageBitmap }
  | { type: "remove-overlay-image"; assetId: number }
  | {
      type: "render";
      revision: number;
      state: EditorState;
      logoAssetId: number | null;
      overlayAssetId: number | null;
    }
  | {
      type: "export";
      requestId: number;
      state: EditorState;
      format: ExportFormat;
      logoAssetId: number | null;
      overlayAssetId: number | null;
    };

export type RenderWorkerResponse =
  | { type: "frame"; revision: number; bitmap: ImageBitmap }
  | {
      type: "exported";
      requestId: number;
      blob: Blob;
    }
  | {
      type: "error";
      requestId?: number;
      message: string;
    };
