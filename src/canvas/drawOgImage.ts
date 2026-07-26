import { OG_HEIGHT, OG_WIDTH } from "../state/constants";
import type { EditorState, TextStyle } from "../state/types";
import { wrapText } from "./wrapText";

/** Horizontal inset so text doesn't touch the edges. */
const CONTENT_PADDING_X = 80;

/** Max logo box at scale 1 (longest side). */
const LOGO_BASE_SIZE = 120;

/** Gap between logo and title, and title and description. */
const BLOCK_GAP = 28;

export type DrawOgImageOptions = {
  /** Decoded logo bitmap when `state.logo.src` is set; ignored otherwise. */
  logoImage?: CanvasImageSource | null;
};

function fontString(style: TextStyle): string {
  return `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  style: TextStyle,
  centerX: number,
  startY: number,
  maxWidth: number,
): number {
  if (!style.content.trim()) {
    return startY;
  }

  ctx.font = fontString(style);
  ctx.fillStyle = style.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  const lineHeight = style.fontSize * 1.25;
  const lines = wrapText(ctx, style.content, maxWidth);
  let y = startY;

  for (const line of lines) {
    ctx.fillText(line, centerX, y);
    y += lineHeight;
  }

  return y;
}

function drawLogo(
  ctx: CanvasRenderingContext2D,
  state: EditorState,
  logoImage: CanvasImageSource,
): void {
  const { x, y, scale } = state.logo;
  const maxSide = LOGO_BASE_SIZE * scale;

  // Intrinsic size when available (HTMLImageElement / ImageBitmap).
  const naturalW =
    "naturalWidth" in logoImage && typeof logoImage.naturalWidth === "number"
      ? logoImage.naturalWidth
      : "width" in logoImage && typeof logoImage.width === "number"
        ? Number(logoImage.width)
        : maxSide;
  const naturalH =
    "naturalHeight" in logoImage && typeof logoImage.naturalHeight === "number"
      ? logoImage.naturalHeight
      : "height" in logoImage && typeof logoImage.height === "number"
        ? Number(logoImage.height)
        : maxSide;

  if (naturalW <= 0 || naturalH <= 0) {
    return;
  }

  const fit = Math.min(maxSide / naturalW, maxSide / naturalH);
  const drawW = naturalW * fit;
  const drawH = naturalH * fit;
  const cx = x * OG_WIDTH;
  const cy = y * OG_HEIGHT;

  ctx.drawImage(logoImage, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
}

/**
 * Single draw path for preview and export.
 * Always paints the full 1200×630 frame.
 */
export function drawOgImage(
  ctx: CanvasRenderingContext2D,
  state: EditorState,
  options: DrawOgImageOptions = {},
): void {
  const { logoImage = null } = options;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, OG_WIDTH, OG_HEIGHT);

  // Background
  ctx.fillStyle = state.backgroundColor;
  ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);

  // Logo (optional)
  if (logoImage && state.logo.src) {
    drawLogo(ctx, state, logoImage);
  }

  const maxTextWidth = OG_WIDTH - CONTENT_PADDING_X * 2;
  const centerX = OG_WIDTH / 2;

  // Vertical layout: if logo present, start text below typical logo band;
  // otherwise center the text block in the canvas.
  const hasLogo = Boolean(logoImage && state.logo.src);
  let textStartY = hasLogo ? OG_HEIGHT * 0.42 : OG_HEIGHT * 0.32;

  // Measure text block height to vertically balance when no logo.
  if (!hasLogo) {
    ctx.font = fontString(state.title);
    const titleLines = wrapText(ctx, state.title.content, maxTextWidth);
    const titleH = titleLines.length * state.title.fontSize * 1.25;

    ctx.font = fontString(state.description);
    const descLines = wrapText(ctx, state.description.content, maxTextWidth);
    const descH = descLines.length * state.description.fontSize * 1.25;

    const blockH =
      titleH +
      (titleH > 0 && descH > 0 ? BLOCK_GAP : 0) +
      descH;
    textStartY = Math.max(CONTENT_PADDING_X, (OG_HEIGHT - blockH) / 2);
  }

  let y = textStartY;
  y = drawWrappedText(ctx, state.title, centerX, y, maxTextWidth);

  if (state.title.content.trim() && state.description.content.trim()) {
    y += BLOCK_GAP;
  }

  drawWrappedText(ctx, state.description, centerX, y, maxTextWidth);

  ctx.restore();
}
