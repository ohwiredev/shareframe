import { normalizeHex } from "../state/color";
import { OG_HEIGHT, OG_WIDTH } from "../state/constants";
import type {
  Background,
  EditorState,
  HorizontalAlignment,
  TextStyle,
} from "../state/types";
import { wrapText } from "./wrapText";

const CONTENT_PADDING_X = 80;
const LOGO_BASE_SIZE = 120;
const BLOCK_GAP = 28;
const LINE_HEIGHT_RATIO = 1.25;

export type OgRenderingContext =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D;

export type RenderAssets = {
  logoImage?: CanvasImageSource | null;
};

type TextLayout = {
  ascent: number;
  height: number;
  lineHeight: number;
  lines: string[];
};

export const CONTEXT_OPTIONS: CanvasRenderingContext2DSettings = {
  alpha: false,
  colorSpace: "srgb",
};

function fontString(style: TextStyle): string {
  return `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
}

function textX(alignment: HorizontalAlignment): number {
  if (alignment === "left") return CONTENT_PADDING_X;
  if (alignment === "right") return OG_WIDTH - CONTENT_PADDING_X;
  return OG_WIDTH / 2;
}

function gradientEndpoints(angle: number) {
  const radians = (angle * Math.PI) / 180;
  const directionX = Math.sin(radians);
  const directionY = -Math.cos(radians);
  const distance =
    (Math.abs(OG_WIDTH * directionX) +
      Math.abs(OG_HEIGHT * directionY)) /
    2;
  const centerX = OG_WIDTH / 2;
  const centerY = OG_HEIGHT / 2;

  return {
    x1: centerX - directionX * distance,
    y1: centerY - directionY * distance,
    x2: centerX + directionX * distance,
    y2: centerY + directionY * distance,
  };
}

function backgroundStyle(
  ctx: OgRenderingContext,
  background: Background,
): string | CanvasGradient {
  if (background.type === "solid") {
    return normalizeHex(background.color) ?? "#000000";
  }

  const { x1, y1, x2, y2 } = gradientEndpoints(background.angle);
  const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  gradient.addColorStop(0, normalizeHex(background.colors[0]) ?? "#000000");
  gradient.addColorStop(1, normalizeHex(background.colors[1]) ?? "#000000");
  return gradient;
}

function configureText(ctx: OgRenderingContext, style: TextStyle): void {
  ctx.font = fontString(style);
  ctx.textAlign = style.alignment;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = normalizeHex(style.color) ?? "#000000";

  if ("fontKerning" in ctx) {
    ctx.fontKerning = "normal";
  }
  if ("textRendering" in ctx) {
    ctx.textRendering = "geometricPrecision";
  }
}

function layoutText(
  ctx: OgRenderingContext,
  style: TextStyle,
  maxWidth: number,
): TextLayout {
  configureText(ctx, style);
  const lines = wrapText(ctx, style.content, maxWidth);
  if (lines.length === 0) {
    return { ascent: 0, height: 0, lineHeight: 0, lines };
  }

  const metrics = ctx.measureText("Mg");
  const ascent =
    metrics.actualBoundingBoxAscent > 0
      ? metrics.actualBoundingBoxAscent
      : style.fontSize * 0.8;
  const descent =
    metrics.actualBoundingBoxDescent > 0
      ? metrics.actualBoundingBoxDescent
      : style.fontSize * 0.2;
  const lineHeight = Math.max(
    style.fontSize * LINE_HEIGHT_RATIO,
    ascent + descent,
  );

  return {
    ascent,
    height: (lines.length - 1) * lineHeight + ascent + descent,
    lineHeight,
    lines,
  };
}

function drawText(
  ctx: OgRenderingContext,
  style: TextStyle,
  layout: TextLayout,
  top: number,
): void {
  if (layout.lines.length === 0) return;

  configureText(ctx, style);
  const x = textX(style.alignment);
  const firstBaseline = top + layout.ascent;

  for (const [index, line] of layout.lines.entries()) {
    ctx.fillText(line, x, firstBaseline + index * layout.lineHeight);
  }
}

function imageDimensions(image: CanvasImageSource): {
  width: number;
  height: number;
} {
  if ("naturalWidth" in image && "naturalHeight" in image) {
    return {
      width: Number(image.naturalWidth),
      height: Number(image.naturalHeight),
    };
  }

  if ("videoWidth" in image && "videoHeight" in image) {
    return {
      width: Number(image.videoWidth),
      height: Number(image.videoHeight),
    };
  }

  return {
    width: "width" in image ? Number(image.width) : LOGO_BASE_SIZE,
    height: "height" in image ? Number(image.height) : LOGO_BASE_SIZE,
  };
}

function drawLogo(
  ctx: OgRenderingContext,
  state: EditorState,
  logoImage: CanvasImageSource,
): void {
  const dimensions = imageDimensions(logoImage);
  if (dimensions.width <= 0 || dimensions.height <= 0) return;

  const maxSide = LOGO_BASE_SIZE * state.logo.scale;
  const fit = Math.min(
    maxSide / dimensions.width,
    maxSide / dimensions.height,
  );
  const width = dimensions.width * fit;
  const height = dimensions.height * fit;
  const x =
    state.logo.alignment === "left"
      ? CONTENT_PADDING_X
      : state.logo.alignment === "right"
        ? OG_WIDTH - CONTENT_PADDING_X - width
        : (OG_WIDTH - width) / 2;
  const y = state.logo.y * OG_HEIGHT - height / 2;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(logoImage, x, y, width, height);
}

function resetContext(ctx: OgRenderingContext): void {
  if ("reset" in ctx && typeof ctx.reset === "function") {
    ctx.reset();
    return;
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, OG_WIDTH, OG_HEIGHT);
}

/**
 * The sole composition path for both preview frames and exported files.
 * The target context must have a 1200×630 backing bitmap.
 */
export function drawOgImage(
  ctx: OgRenderingContext,
  state: EditorState,
  assets: RenderAssets = {},
): void {
  resetContext(ctx);

  ctx.fillStyle = backgroundStyle(ctx, state.background);
  ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);

  const logoImage = state.logo.src ? assets.logoImage : null;
  if (logoImage) {
    drawLogo(ctx, state, logoImage);
  }

  const maxTextWidth = OG_WIDTH - CONTENT_PADDING_X * 2;
  const titleLayout = layoutText(
    ctx,
    state.title,
    maxTextWidth * (state.title.width / 100),
  );
  const descriptionLayout = layoutText(
    ctx,
    state.description,
    maxTextWidth * (state.description.width / 100),
  );
  const hasGap = titleLayout.height > 0 && descriptionLayout.height > 0;
  const blockHeight =
    titleLayout.height +
    (hasGap ? BLOCK_GAP : 0) +
    descriptionLayout.height;
  const textStartY = logoImage
    ? OG_HEIGHT * 0.42
    : Math.max(CONTENT_PADDING_X, (OG_HEIGHT - blockHeight) / 2);
  const descriptionY =
    textStartY + titleLayout.height + (hasGap ? BLOCK_GAP : 0);

  drawText(ctx, state.title, titleLayout, textStartY);
  drawText(ctx, state.description, descriptionLayout, descriptionY);
}
