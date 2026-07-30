import { normalizeHex } from "../state/color";
import { OG_HEIGHT, OG_WIDTH } from "../state/constants";
import type { Background, EditorState, HorizontalAlignment, TextStyle } from "../state/types";
import { wrapText } from "./wrapText";

const CONTENT_PADDING_X = 80;
const LOGO_BASE_SIZE = 120;
const BLOCK_GAP = 28;
const LINE_HEIGHT_RATIO = 1.25;

export type OgRenderingContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export type RenderAssets = {
  logoImage?: CanvasImageSource | null;
  overlayImage?: CanvasImageSource | null;
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

function textX(
  alignment: HorizontalAlignment,
  columnBounds?: { left: number; right: number },
): number {
  const left = columnBounds?.left ?? CONTENT_PADDING_X;
  const right = columnBounds?.right ?? OG_WIDTH - CONTENT_PADDING_X;
  if (alignment === "left") return left;
  if (alignment === "right") return right;
  return (left + right) / 2;
}

function gradientEndpoints(angle: number) {
  const radians = (angle * Math.PI) / 180;
  const directionX = Math.sin(radians);
  const directionY = -Math.cos(radians);
  const distance = (Math.abs(OG_WIDTH * directionX) + Math.abs(OG_HEIGHT * directionY)) / 2;
  const centerX = OG_WIDTH / 2;
  const centerY = OG_HEIGHT / 2;

  return {
    x1: centerX - directionX * distance,
    y1: centerY - directionY * distance,
    x2: centerX + directionX * distance,
    y2: centerY + directionY * distance,
  };
}

function backgroundStyle(ctx: OgRenderingContext, background: Background): string | CanvasGradient {
  if (background.type === "solid") {
    return normalizeHex(background.color) ?? "#000000";
  }

  const { x1, y1, x2, y2 } = gradientEndpoints(background.angle);
  const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  const colors =
    background.colors && background.colors.length > 0 ? background.colors : ["#000000", "#000000"];
  if (colors.length === 1) {
    const hex = normalizeHex(colors[0]) ?? "#000000";
    gradient.addColorStop(0, hex);
    gradient.addColorStop(1, hex);
  } else {
    colors.forEach((color, i) => {
      const offset = i / (colors.length - 1);
      gradient.addColorStop(offset, normalizeHex(color) ?? "#000000");
    });
  }
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

function layoutText(ctx: OgRenderingContext, style: TextStyle, maxWidth: number): TextLayout {
  configureText(ctx, style);
  const lines = wrapText(ctx, style.content, maxWidth);
  if (lines.length === 0) {
    return { ascent: 0, height: 0, lineHeight: 0, lines };
  }

  const metrics = ctx.measureText("Mg");
  const ascent =
    metrics.actualBoundingBoxAscent > 0 ? metrics.actualBoundingBoxAscent : style.fontSize * 0.8;
  const descent =
    metrics.actualBoundingBoxDescent > 0 ? metrics.actualBoundingBoxDescent : style.fontSize * 0.2;
  const lineHeight = Math.max(style.fontSize * LINE_HEIGHT_RATIO, ascent + descent);

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
  columnBounds?: { left: number; right: number },
): void {
  if (layout.lines.length === 0) return;

  configureText(ctx, style);
  const x = textX(style.alignment, columnBounds);
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
  columnBounds?: { left: number; right: number },
): void {
  const dimensions = imageDimensions(logoImage);
  if (dimensions.width <= 0 || dimensions.height <= 0) return;

  const maxSide = LOGO_BASE_SIZE * state.logo.scale;
  const fit = Math.min(maxSide / dimensions.width, maxSide / dimensions.height);
  const width = dimensions.width * fit;
  const height = dimensions.height * fit;
  const left = columnBounds?.left ?? CONTENT_PADDING_X;
  const right = columnBounds?.right ?? OG_WIDTH - CONTENT_PADDING_X;
  const x =
    state.logo.alignment === "left"
      ? left
      : state.logo.alignment === "right"
        ? right - width
        : left + (right - left - width) / 2;
  const y = state.logo.y * OG_HEIGHT - height / 2;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(logoImage, x, y, width, height);
}

function drawRoundRectPath(
  ctx: OgRenderingContext,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(Math.max(r, 0), w / 2, h / 2);
  ctx.beginPath();
  if ("roundRect" in ctx && typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, radius);
    return;
  }
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawOverlayCard(
  ctx: OgRenderingContext,
  state: EditorState,
  overlayImage: CanvasImageSource,
): void {
  if (!state.image.enabled) return;
  const dimensions = imageDimensions(overlayImage);
  if (dimensions.width <= 0 || dimensions.height <= 0) return;

  const { position, scale, borderRadius, shadow, shadowBlur = 32, yOffset = 0 } = state.image;

  let maxBoxWidth = (OG_WIDTH - CONTENT_PADDING_X * 2) * scale;
  let maxBoxHeight = 300 * scale;
  let x = CONTENT_PADDING_X;
  let y = OG_HEIGHT - maxBoxHeight - 30 + yOffset;

  if (position === "right") {
    maxBoxWidth = OG_WIDTH * 0.46 * scale;
    maxBoxHeight = OG_HEIGHT * 0.78 * scale;
    const fit = Math.min(maxBoxWidth / dimensions.width, maxBoxHeight / dimensions.height);
    const width = dimensions.width * fit;
    const height = dimensions.height * fit;
    x = OG_WIDTH - CONTENT_PADDING_X - width;
    y = (OG_HEIGHT - height) / 2 + yOffset;

    drawFramedImage(ctx, overlayImage, x, y, width, height, borderRadius, shadow, shadowBlur);
    return;
  }

  if (position === "left") {
    maxBoxWidth = OG_WIDTH * 0.46 * scale;
    maxBoxHeight = OG_HEIGHT * 0.78 * scale;
    const fit = Math.min(maxBoxWidth / dimensions.width, maxBoxHeight / dimensions.height);
    const width = dimensions.width * fit;
    const height = dimensions.height * fit;
    x = CONTENT_PADDING_X;
    y = (OG_HEIGHT - height) / 2 + yOffset;

    drawFramedImage(ctx, overlayImage, x, y, width, height, borderRadius, shadow, shadowBlur);
    return;
  }

  // "bottom" layout
  const fit = Math.min(maxBoxWidth / dimensions.width, maxBoxHeight / dimensions.height);
  const width = dimensions.width * fit;
  const height = dimensions.height * fit;
  x = (OG_WIDTH - width) / 2;
  y = OG_HEIGHT - height - 32 + yOffset;

  drawFramedImage(ctx, overlayImage, x, y, width, height, borderRadius, shadow, shadowBlur);
}

function drawFramedImage(
  ctx: OgRenderingContext,
  image: CanvasImageSource,
  x: number,
  y: number,
  width: number,
  height: number,
  borderRadius: number,
  shadow: boolean,
  shadowBlur: number = 32,
): void {
  ctx.save();
  if (shadow && shadowBlur > 0) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetY = Math.round(shadowBlur * 0.45);
    ctx.fillStyle = "#000000";
    drawRoundRectPath(ctx, x, y, width, height, borderRadius);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  drawRoundRectPath(ctx, x, y, width, height, borderRadius);
  ctx.clip();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, x, y, width, height);
  ctx.restore();
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
 * Renders an OG preview or export frame from state.
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

  const overlayImage = state.image?.enabled && state.image?.src ? assets.overlayImage : null;
  const hasOverlay = Boolean(overlayImage);

  let columnBounds: { left: number; right: number } | undefined;
  if (hasOverlay) {
    if (state.image.position === "right") {
      columnBounds = { left: CONTENT_PADDING_X, right: OG_WIDTH * 0.48 };
    } else if (state.image.position === "left") {
      columnBounds = {
        left: OG_WIDTH * 0.52,
        right: OG_WIDTH - CONTENT_PADDING_X,
      };
    }
  }

  const logoImage = state.logo.src ? assets.logoImage : null;
  if (logoImage) {
    drawLogo(ctx, state, logoImage, columnBounds);
  }

  const maxColumnWidth = columnBounds
    ? columnBounds.right - columnBounds.left
    : OG_WIDTH - CONTENT_PADDING_X * 2;

  const titleLayout = layoutText(ctx, state.title, maxColumnWidth * (state.title.width / 100));
  const descriptionLayout = layoutText(
    ctx,
    state.description,
    maxColumnWidth * (state.description.width / 100),
  );
  const hasGap = titleLayout.height > 0 && descriptionLayout.height > 0;
  const blockHeight = titleLayout.height + (hasGap ? BLOCK_GAP : 0) + descriptionLayout.height;

  let textStartY: number;
  if (hasOverlay && state.image.position === "bottom") {
    textStartY = logoImage ? 130 : 80;
  } else {
    textStartY = logoImage
      ? OG_HEIGHT * 0.42
      : Math.max(CONTENT_PADDING_X, (OG_HEIGHT - blockHeight) / 2);
  }

  const titleYOffset = state.title.yOffset ?? 0;
  const descriptionYOffset = state.description.yOffset ?? 0;

  const descriptionY = textStartY + titleLayout.height + (hasGap ? BLOCK_GAP : 0);

  drawText(ctx, state.title, titleLayout, textStartY + titleYOffset, columnBounds);
  drawText(
    ctx,
    state.description,
    descriptionLayout,
    descriptionY + descriptionYOffset,
    columnBounds,
  );

  if (hasOverlay && overlayImage) {
    drawOverlayCard(ctx, state, overlayImage);
  }
}
