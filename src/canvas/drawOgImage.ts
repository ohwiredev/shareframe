import { normalizeHex } from "../state/color";
import { OG_HEIGHT, OG_WIDTH } from "../state/constants";
import type {
  Background,
  BadgeState,
  EditorState,
  HorizontalAlignment,
  ImageElement,
  LogoElement,
  PriceState,
  RatingState,
  RelativeAnchor,
  SafeAreaConfig,
  ShapeElement,
  TextStyle,
} from "../state/types";
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

export type ResolvedSafeArea = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
};

export type ElementBounds = {
  id: string;
  role?: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export function resolveSafeArea(safeArea?: SafeAreaConfig): ResolvedSafeArea {
  const left = safeArea?.left ?? CONTENT_PADDING_X;
  const right = OG_WIDTH - (safeArea?.right ?? CONTENT_PADDING_X);
  const top = safeArea?.top ?? 60;
  const bottom = OG_HEIGHT - (safeArea?.bottom ?? 60);
  return {
    left,
    right,
    top,
    bottom,
    width: Math.max(10, right - left),
    height: Math.max(10, bottom - top),
  };
}

export function findTargetBounds(
  targetRef: string,
  boundsMap: Map<string, ElementBounds>,
  lastBounds?: ElementBounds,
): ElementBounds | undefined {
  if (targetRef === "previous") return lastBounds;
  if (boundsMap.has(targetRef)) return boundsMap.get(targetRef);

  for (const bounds of boundsMap.values()) {
    if (bounds.role === targetRef || bounds.type === targetRef) {
      return bounds;
    }
  }
  return undefined;
}

export function resolveRelativePosition(
  el: {
    relativeTo?: string;
    relativeAnchor?: RelativeAnchor;
    offsetX?: number;
    offsetY?: number;
  },
  elementWidth: number,
  elementHeight: number,
  boundsMap: Map<string, ElementBounds>,
  lastBounds?: ElementBounds,
  defaultY?: number,
  defaultX?: number,
): { x?: number; y: number } {
  if (!el.relativeTo) {
    return {
      x: defaultX !== undefined ? defaultX + (el.offsetX ?? 0) : undefined,
      y: (defaultY ?? 0) + (el.offsetY ?? 0),
    };
  }

  const target = findTargetBounds(el.relativeTo, boundsMap, lastBounds);
  if (!target) {
    return {
      x: defaultX !== undefined ? defaultX + (el.offsetX ?? 0) : undefined,
      y: (defaultY ?? 0) + (el.offsetY ?? 0),
    };
  }

  const anchor = el.relativeAnchor ?? "below";
  const offsetX = el.offsetX ?? 0;
  const offsetY = el.offsetY ?? 0;

  let x = defaultX;
  let y = defaultY ?? target.y;

  switch (anchor) {
    case "below":
      y = target.y + target.height + offsetY;
      break;
    case "above":
      y = target.y - elementHeight - offsetY;
      break;
    case "right-of":
      x = target.x + target.width + offsetX;
      break;
    case "left-of":
      x = target.x - elementWidth - offsetX;
      break;
    case "top":
      y = target.y + offsetY;
      break;
    case "bottom":
      y = target.y + target.height - elementHeight + offsetY;
      break;
    case "left":
      x = target.x + offsetX;
      break;
    case "right":
      x = target.x + target.width - elementWidth + offsetX;
      break;
    case "center":
      x = target.x + (target.width - elementWidth) / 2 + offsetX;
      y = target.y + (target.height - elementHeight) / 2 + offsetY;
      break;
  }

  return { x, y };
}

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

function farthestCornerRadius(cx: number, cy: number): number {
  const corners: Array<[number, number]> = [
    [0, 0],
    [OG_WIDTH, 0],
    [0, OG_HEIGHT],
    [OG_WIDTH, OG_HEIGHT],
  ];
  return Math.max(...corners.map(([x, y]) => Math.hypot(x - cx, y - cy)));
}

function applyColorStops(gradient: CanvasGradient, colors: string[], stops?: number[]): void {
  const palette = colors.length > 0 ? colors : ["#000000", "#000000"];
  if (palette.length === 1) {
    const hex = normalizeHex(palette[0]) ?? "#000000";
    gradient.addColorStop(0, hex);
    gradient.addColorStop(1, hex);
    return;
  }

  palette.forEach((color, i) => {
    const raw = stops?.[i] ?? i / (palette.length - 1);
    const offset = Math.min(1, Math.max(0, raw));
    gradient.addColorStop(offset, normalizeHex(color) ?? "#000000");
  });
}

function backgroundStyle(ctx: OgRenderingContext, background: Background): string | CanvasGradient {
  if (background.type === "solid") {
    return normalizeHex(background.color) ?? "#000000";
  }

  const colors =
    background.colors && background.colors.length > 0 ? background.colors : ["#000000", "#000000"];

  if (background.style === "radial") {
    const cx = (background.cx ?? 0.5) * OG_WIDTH;
    const cy = (background.cy ?? 0.5) * OG_HEIGHT;
    const radius =
      typeof background.radius === "number" ? background.radius : farthestCornerRadius(cx, cy);
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(radius, 1));
    applyColorStops(gradient, colors, background.stops);
    return gradient;
  }

  const { x1, y1, x2, y2 } = gradientEndpoints(background.angle ?? 135);
  const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  applyColorStops(gradient, colors, background.stops);
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
  logo: LogoElement,
  logoImage: CanvasImageSource,
  columnBounds?: { left: number; right: number },
): void {
  const dimensions = imageDimensions(logoImage);
  if (dimensions.width <= 0 || dimensions.height <= 0) return;

  const maxSide = LOGO_BASE_SIZE * logo.scale;
  const fit = Math.min(maxSide / dimensions.width, maxSide / dimensions.height);
  const width = dimensions.width * fit;
  const height = dimensions.height * fit;
  const left = columnBounds?.left ?? CONTENT_PADDING_X;
  const right = columnBounds?.right ?? OG_WIDTH - CONTENT_PADDING_X;
  const x =
    logo.alignment === "left"
      ? left
      : logo.alignment === "right"
        ? right - width
        : left + (right - left - width) / 2;
  const y = logo.y * OG_HEIGHT - height / 2;

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
  ctx.lineTo(x + radius, y);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawOverlayCard(
  ctx: OgRenderingContext,
  image: ImageElement,
  overlayImage: CanvasImageSource,
): void {
  if (image.enabled === false) return;
  const dimensions = imageDimensions(overlayImage);
  if (dimensions.width <= 0 || dimensions.height <= 0) return;

  const { position = "bottom", scale, borderRadius, shadow, shadowBlur = 32, yOffset = 0 } = image;

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

/* ---------- E-commerce drawing helpers ---------- */

const BADGE_FONT = '700 14px "Inter", "system-ui", sans-serif';
const BADGE_PADDING_X = 14;
const BADGE_PADDING_Y = 8;
const BADGE_RADIUS = 8;
const BADGE_Y = 36;

const PRICE_FONT_SIZE = 36;
const ORIGINAL_PRICE_FONT_SIZE = 22;
const RATING_STAR_SIZE = 10;
const RATING_GAP = 3;

function drawBadge(
  ctx: OgRenderingContext,
  badge: BadgeState,
  columnBounds?: { left: number; right: number },
): void {
  if (!badge.text) return;

  ctx.save();
  ctx.font = BADGE_FONT;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const metrics = ctx.measureText(badge.text.toUpperCase());
  const textWidth = metrics.width;
  const pillW = textWidth + BADGE_PADDING_X * 2;
  const pillH = 14 + BADGE_PADDING_Y * 2;
  const x = columnBounds?.left ?? CONTENT_PADDING_X;

  // Draw pill background
  ctx.fillStyle = normalizeHex(badge.background) ?? "#10b981";
  drawRoundRectPath(ctx, x, BADGE_Y, pillW, pillH, BADGE_RADIUS);
  ctx.fill();

  // Draw text
  ctx.fillStyle = normalizeHex(badge.color) ?? "#ffffff";
  ctx.fillText(
    badge.text.toUpperCase(),
    x + BADGE_PADDING_X,
    BADGE_Y + pillH - BADGE_PADDING_Y - 1,
  );
  ctx.restore();
}

function drawPriceBlock(
  ctx: OgRenderingContext,
  price: PriceState | undefined,
  originalPrice: PriceState | undefined,
  topY: number,
  alignment: HorizontalAlignment,
  columnBounds?: { left: number; right: number },
): number {
  if (!price?.text && !originalPrice?.text) return topY;

  const left = columnBounds?.left ?? CONTENT_PADDING_X;
  const right = columnBounds?.right ?? OG_WIDTH - CONTENT_PADDING_X;
  let cursorX: number;

  const priceFontSize = price?.fontSize ?? PRICE_FONT_SIZE;
  const priceYOffset = price?.yOffset ?? 0;
  const drawTopY = topY + priceYOffset;

  ctx.save();
  ctx.textBaseline = "alphabetic";

  let bottomY = topY;

  if (price?.text) {
    ctx.font = `700 ${priceFontSize}px "Inter", "system-ui", sans-serif`;
    ctx.fillStyle = normalizeHex(price.color) ?? "#10b981";
    ctx.textAlign = alignment;
    cursorX = alignment === "left" ? left : alignment === "right" ? right : (left + right) / 2;
    ctx.fillText(price.text, cursorX, drawTopY + priceFontSize * 0.85);

    const priceWidth = ctx.measureText(price.text).width;
    bottomY = drawTopY + priceFontSize;

    // Draw original price with strikethrough next to current price
    if (originalPrice?.text) {
      const origFontSize = originalPrice.fontSize ?? ORIGINAL_PRICE_FONT_SIZE;
      ctx.font = `400 ${origFontSize}px "Inter", "system-ui", sans-serif`;
      ctx.fillStyle = normalizeHex(originalPrice.color) ?? "#9ca3af";

      let opX: number;
      if (alignment === "left") {
        opX = cursorX + priceWidth + 12;
      } else if (alignment === "right") {
        const opWidth = ctx.measureText(originalPrice.text).width;
        opX = cursorX - priceWidth - 12 - opWidth;
        // For right alignment, we draw left-aligned relative to opX
        ctx.textAlign = "left";
      } else {
        opX = cursorX + priceWidth / 2 + 12;
        ctx.textAlign = "left";
      }

      const opY = drawTopY + priceFontSize * 0.85 - (priceFontSize - origFontSize) / 2;
      ctx.fillText(originalPrice.text, opX, opY);

      // Strikethrough line
      const opWidth = ctx.measureText(originalPrice.text).width;
      ctx.strokeStyle = ctx.fillStyle as string;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const lineY = opY - origFontSize * 0.32;
      ctx.moveTo(opX - 2, lineY);
      ctx.lineTo(opX + opWidth + 2, lineY);
      ctx.stroke();
    }
  }

  ctx.restore();
  return bottomY;
}

function drawStar(
  ctx: OgRenderingContext,
  cx: number,
  cy: number,
  size: number,
  fillFraction: number,
  filledColor: string,
  emptyColor: string,
): void {
  const outerR = size;
  const innerR = size * 0.4;
  const points = 5;

  // Build star path points
  const starPoints: Array<[number, number]> = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI / 2) * -1 + (Math.PI / points) * i;
    const r = i % 2 === 0 ? outerR : innerR;
    starPoints.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
  }

  const drawStarPath = () => {
    ctx.beginPath();
    for (const [i, [px, py]] of starPoints.entries()) {
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  };

  if (fillFraction >= 1) {
    // Fully filled
    ctx.fillStyle = filledColor;
    drawStarPath();
    ctx.fill();
  } else if (fillFraction <= 0) {
    // Empty
    ctx.fillStyle = emptyColor;
    drawStarPath();
    ctx.fill();
  } else {
    // Partial fill — draw empty star first, then clip for filled portion
    ctx.fillStyle = emptyColor;
    drawStarPath();
    ctx.fill();

    ctx.save();
    drawStarPath();
    ctx.clip();
    ctx.fillStyle = filledColor;
    ctx.fillRect(cx - outerR, cy - outerR, outerR * 2 * fillFraction, outerR * 2);
    ctx.restore();
  }
}

function drawRatingBlock(
  ctx: OgRenderingContext,
  rating: RatingState,
  topY: number,
  alignment: HorizontalAlignment,
  columnBounds?: { left: number; right: number },
): number {
  if (rating.value <= 0 && !rating.reviewCount) return topY;

  const left = columnBounds?.left ?? CONTENT_PADDING_X;
  const right = columnBounds?.right ?? OG_WIDTH - CONTENT_PADDING_X;
  const starCount = 5;
  const starSpacing = RATING_STAR_SIZE * 2 + RATING_GAP;
  const starsWidth = starCount * starSpacing - RATING_GAP;

  const filledColor = normalizeHex(rating.color) ?? "#f59e0b";
  const emptyColor = "rgba(156, 163, 175, 0.4)";

  // Measure review count text width for total block width calculation
  ctx.save();
  ctx.font = '400 14px "Inter", "system-ui", sans-serif';
  const ratingNumText = `${rating.value.toFixed(1)}/5`;
  const reviewText = rating.reviewCount ? ` (${rating.reviewCount})` : "";
  const fullReviewText = ratingNumText + reviewText;
  const reviewTextWidth = ctx.measureText(fullReviewText).width;
  const totalWidth = starsWidth + 8 + reviewTextWidth;

  let startX: number;
  if (alignment === "left") {
    startX = left;
  } else if (alignment === "right") {
    startX = right - totalWidth;
  } else {
    startX = (left + right - totalWidth) / 2;
  }

  const starCY = topY + RATING_STAR_SIZE;

  for (let i = 0; i < starCount; i++) {
    const starCX = startX + i * starSpacing + RATING_STAR_SIZE;
    const fill = Math.max(0, Math.min(1, rating.value - i));
    drawStar(ctx, starCX, starCY, RATING_STAR_SIZE, fill, filledColor, emptyColor);
  }

  // Draw rating text
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = normalizeHex(rating.color) ?? "#f59e0b";
  ctx.font = '600 14px "Inter", "system-ui", sans-serif';
  ctx.fillText(ratingNumText, startX + starsWidth + 8, starCY);

  if (rating.reviewCount) {
    const numWidth = ctx.measureText(ratingNumText).width;
    ctx.fillStyle = "rgba(156, 163, 175, 0.8)";
    ctx.font = '400 14px "Inter", "system-ui", sans-serif';
    ctx.fillText(reviewText, startX + starsWidth + 8 + numWidth, starCY);
  }

  ctx.restore();
  return topY + RATING_STAR_SIZE * 2 + 6;
}

import {
  findBadgeElement,
  findImageElement,
  findLogoElement,
  findPriceElement,
  findRatingElement,
  findTextElement,
  normalizeState,
} from "../state/elementUtils";

function drawShapeElement(
  ctx: OgRenderingContext,
  shape: ShapeElement,
  columnBounds?: { left: number; right: number },
): void {
  ctx.save();
  const left = columnBounds?.left ?? CONTENT_PADDING_X;
  const x = shape.x ?? left;
  const y = shape.y ?? 100;

  if (shape.fill) {
    ctx.fillStyle = normalizeHex(shape.fill) ?? shape.fill;
  }
  if (shape.stroke) {
    ctx.strokeStyle = normalizeHex(shape.stroke) ?? shape.stroke;
    ctx.lineWidth = shape.strokeWidth ?? 1;
  }

  if (shape.shapeType === "rectangle") {
    if (shape.borderRadius) {
      drawRoundRectPath(ctx, x, y, shape.width, shape.height, shape.borderRadius);
      if (shape.fill) ctx.fill();
      if (shape.stroke) ctx.stroke();
    } else {
      if (shape.fill) ctx.fillRect(x, y, shape.width, shape.height);
      if (shape.stroke) ctx.strokeRect(x, y, shape.width, shape.height);
    }
  } else if (shape.shapeType === "circle") {
    const r = Math.min(shape.width, shape.height) / 2;
    ctx.beginPath();
    ctx.arc(x + r, y + r, r, 0, Math.PI * 2);
    if (shape.fill) ctx.fill();
    if (shape.stroke) ctx.stroke();
  } else if (shape.shapeType === "line") {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + shape.width, y + shape.height);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Renders an OG preview or export frame from state.
 * The target context must have a 1200×630 backing bitmap.
 */
export function drawOgImage(
  ctx: OgRenderingContext,
  rawState: EditorState,
  assets: RenderAssets = {},
): void {
  resetContext(ctx);

  const state = normalizeState(rawState);

  ctx.fillStyle = backgroundStyle(ctx, state.background);
  ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);

  const safeArea = resolveSafeArea(state.safeArea);
  const elementBoundsMap = new Map<string, ElementBounds>();
  elementBoundsMap.set("safe-area", {
    id: "safe-area",
    type: "container",
    x: safeArea.left,
    y: safeArea.top,
    width: safeArea.width,
    height: safeArea.height,
  });

  const imageElement = findImageElement(state);
  const overlayImage = imageElement?.enabled && imageElement?.src ? assets.overlayImage : null;
  const hasOverlay = Boolean(overlayImage);

  let defaultColumnBounds: { left: number; right: number } | undefined;
  if (hasOverlay && imageElement) {
    if (imageElement.position === "right") {
      defaultColumnBounds = { left: safeArea.left, right: OG_WIDTH * 0.48 };
    } else if (imageElement.position === "left") {
      defaultColumnBounds = {
        left: OG_WIDTH * 0.52,
        right: safeArea.right,
      };
    }
  }

  let lastBounds: ElementBounds | undefined;

  // Render elements declaratively or by group sequence
  const badgeElement = findBadgeElement(state);
  if (badgeElement?.text) {
    const badgeCols = defaultColumnBounds ?? { left: safeArea.left, right: safeArea.right };
    drawBadge(ctx, badgeElement, badgeCols);
    const badgeBounds: ElementBounds = {
      id: badgeElement.id ?? "badge-main",
      role: "badge",
      type: "badge",
      x: badgeCols.left,
      y: BADGE_Y,
      width: badgeCols.right - badgeCols.left,
      height: 30,
    };
    elementBoundsMap.set(badgeBounds.id, badgeBounds);
    elementBoundsMap.set("badge", badgeBounds);
    lastBounds = badgeBounds;
  }

  const logoElement = findLogoElement(state);
  const logoImage = logoElement?.src ? assets.logoImage : null;
  if (logoElement && logoImage) {
    const logoCols = defaultColumnBounds ?? { left: safeArea.left, right: safeArea.right };
    drawLogo(ctx, logoElement, logoImage, logoCols);
    const logoY = logoElement.y * OG_HEIGHT - LOGO_BASE_SIZE / 2;
    const logoBounds: ElementBounds = {
      id: logoElement.id ?? "logo-main",
      role: "logo",
      type: "logo",
      x: logoCols.left,
      y: logoY,
      width: LOGO_BASE_SIZE * logoElement.scale,
      height: LOGO_BASE_SIZE * logoElement.scale,
    };
    elementBoundsMap.set(logoBounds.id, logoBounds);
    elementBoundsMap.set("logo", logoBounds);
    lastBounds = logoBounds;
  }

  // Draw any standalone shape elements
  for (const el of state.elements) {
    if (el.type === "shape") {
      const shapeCols = defaultColumnBounds ?? { left: safeArea.left, right: safeArea.right };
      const defaultY = el.y ?? 100;
      const defaultX = el.x ?? shapeCols.left;
      const relPos = resolveRelativePosition(
        el,
        el.width,
        el.height,
        elementBoundsMap,
        lastBounds,
        defaultY,
        defaultX,
      );
      const targetShape: ShapeElement = {
        ...el,
        x: relPos.x ?? defaultX,
        y: relPos.y,
      };
      drawShapeElement(ctx, targetShape, shapeCols);
      const shapeBounds: ElementBounds = {
        id: el.id,
        type: "shape",
        x: targetShape.x ?? shapeCols.left,
        y: targetShape.y ?? 100,
        width: el.width,
        height: el.height,
      };
      elementBoundsMap.set(el.id, shapeBounds);
      lastBounds = shapeBounds;
    }
  }

  const titleElement = findTextElement(state, "title");
  const descriptionElement = findTextElement(state, "description");

  const titleCols = defaultColumnBounds ?? { left: safeArea.left, right: safeArea.right };
  const maxTitleColumnWidth = titleCols.right - titleCols.left;

  const descCols = defaultColumnBounds ?? { left: safeArea.left, right: safeArea.right };
  const maxDescColumnWidth = descCols.right - descCols.left;

  const titleStyle: TextStyle = titleElement
    ? {
        content: titleElement.content,
        fontFamily: titleElement.fontFamily,
        fontSize: titleElement.fontSize,
        width: titleElement.width,
        fontWeight: titleElement.fontWeight,
        color: titleElement.color,
        alignment: titleElement.alignment,
        yOffset: titleElement.yOffset ?? 0,
      }
    : {
        content: "",
        fontFamily: "Inter",
        fontSize: 48,
        width: 100,
        fontWeight: 700,
        color: "#ffffff",
        alignment: "center",
        yOffset: 0,
      };

  const descriptionStyle: TextStyle = descriptionElement
    ? {
        content: descriptionElement.content,
        fontFamily: descriptionElement.fontFamily,
        fontSize: descriptionElement.fontSize,
        width: descriptionElement.width,
        fontWeight: descriptionElement.fontWeight,
        color: descriptionElement.color,
        alignment: descriptionElement.alignment,
        yOffset: descriptionElement.yOffset ?? 0,
      }
    : {
        content: "",
        fontFamily: "Inter",
        fontSize: 24,
        width: 80,
        fontWeight: 400,
        color: "#9ca3af",
        alignment: "center",
        yOffset: 0,
      };

  const titleLayout = layoutText(ctx, titleStyle, maxTitleColumnWidth * (titleStyle.width / 100));
  const descriptionLayout = layoutText(
    ctx,
    descriptionStyle,
    maxDescColumnWidth * (descriptionStyle.width / 100),
  );
  const hasGap = titleLayout.height > 0 && descriptionLayout.height > 0;
  const blockHeight = titleLayout.height + (hasGap ? BLOCK_GAP : 0) + descriptionLayout.height;

  let textStartY: number;
  if (hasOverlay && imageElement?.position === "bottom") {
    textStartY = logoImage ? safeArea.top + 70 : safeArea.top + 20;
  } else {
    textStartY = logoImage
      ? OG_HEIGHT * 0.42
      : Math.max(safeArea.top, (OG_HEIGHT - blockHeight) / 2);
  }

  let finalTitleY = textStartY + titleStyle.yOffset;
  if (titleElement?.relativeTo) {
    const relPos = resolveRelativePosition(
      titleElement,
      maxTitleColumnWidth,
      titleLayout.height,
      elementBoundsMap,
      lastBounds,
      textStartY,
    );
    finalTitleY = relPos.y;
  }

  if (titleStyle.content) {
    drawText(ctx, titleStyle, titleLayout, finalTitleY, titleCols);
    const titleBounds: ElementBounds = {
      id: titleElement?.id ?? "text-title",
      role: "title",
      type: "text",
      x: titleCols.left,
      y: finalTitleY,
      width: maxTitleColumnWidth,
      height: titleLayout.height,
    };
    elementBoundsMap.set(titleBounds.id, titleBounds);
    elementBoundsMap.set("title", titleBounds);
    lastBounds = titleBounds;
  }

  const defaultDescY = finalTitleY + titleLayout.height + (hasGap ? BLOCK_GAP : 0);
  let finalDescY = defaultDescY + descriptionStyle.yOffset;
  if (descriptionElement?.relativeTo) {
    const relPos = resolveRelativePosition(
      descriptionElement,
      maxDescColumnWidth,
      descriptionLayout.height,
      elementBoundsMap,
      lastBounds,
      defaultDescY,
    );
    finalDescY = relPos.y;
  }

  if (descriptionStyle.content) {
    drawText(ctx, descriptionStyle, descriptionLayout, finalDescY, descCols);
    const descBounds: ElementBounds = {
      id: descriptionElement?.id ?? "text-description",
      role: "description",
      type: "text",
      x: descCols.left,
      y: finalDescY,
      width: maxDescColumnWidth,
      height: descriptionLayout.height,
    };
    elementBoundsMap.set(descBounds.id, descBounds);
    elementBoundsMap.set("description", descBounds);
    lastBounds = descBounds;
  }

  // Draw any additional custom text elements
  for (const el of state.elements) {
    if (el.type === "text" && el.role === "custom" && el.content) {
      const customCols = defaultColumnBounds ?? { left: safeArea.left, right: safeArea.right };
      const maxColWidth = customCols.right - customCols.left;
      const customStyle: TextStyle = {
        content: el.content,
        fontFamily: el.fontFamily,
        fontSize: el.fontSize,
        width: el.width,
        fontWeight: el.fontWeight,
        color: el.color,
        alignment: el.alignment,
        yOffset: el.yOffset ?? 0,
      };
      const layout = layoutText(ctx, customStyle, maxColWidth * (customStyle.width / 100));
      const defaultY = el.y ?? 200;
      const relPos = resolveRelativePosition(
        el,
        maxColWidth,
        layout.height,
        elementBoundsMap,
        lastBounds,
        defaultY,
      );
      const drawY = relPos.y + customStyle.yOffset;
      drawText(ctx, customStyle, layout, drawY, customCols);

      const customBounds: ElementBounds = {
        id: el.id,
        role: el.role,
        type: "text",
        x: customCols.left,
        y: drawY,
        width: maxColWidth,
        height: layout.height,
      };
      elementBoundsMap.set(el.id, customBounds);
      lastBounds = customBounds;
    }
  }

  // Draw price element
  let cursorY = finalDescY + descriptionLayout.height;
  const priceElement = findPriceElement(state);
  if (priceElement && (priceElement.text || priceElement.originalPriceText)) {
    const priceCols = defaultColumnBounds ?? { left: safeArea.left, right: safeArea.right };
    const priceState: PriceState = {
      text: priceElement.text,
      color: priceElement.color,
      fontSize: priceElement.fontSize,
      yOffset: priceElement.yOffset,
    };
    const origPriceState: PriceState | undefined = priceElement.originalPriceText
      ? {
          text: priceElement.originalPriceText,
          color: priceElement.originalPriceColor ?? "#9ca3af",
          fontSize: priceElement.originalPriceFontSize,
        }
      : undefined;

    let targetPriceTopY = cursorY + 16;
    if (priceElement.relativeTo) {
      const relPos = resolveRelativePosition(
        priceElement,
        priceCols.right - priceCols.left,
        36,
        elementBoundsMap,
        lastBounds,
        targetPriceTopY,
      );
      targetPriceTopY = relPos.y;
    }

    cursorY = drawPriceBlock(
      ctx,
      priceState,
      origPriceState,
      targetPriceTopY,
      titleStyle.alignment,
      priceCols,
    );

    const priceBounds: ElementBounds = {
      id: priceElement.id ?? "price-main",
      role: "price",
      type: "price",
      x: priceCols.left,
      y: targetPriceTopY,
      width: priceCols.right - priceCols.left,
      height: cursorY - targetPriceTopY,
    };
    elementBoundsMap.set(priceBounds.id, priceBounds);
    elementBoundsMap.set("price", priceBounds);
    lastBounds = priceBounds;
  }

  // Draw rating element
  const ratingElement = findRatingElement(state);
  if (ratingElement && (ratingElement.value > 0 || ratingElement.reviewCount)) {
    const ratingCols = defaultColumnBounds ?? { left: safeArea.left, right: safeArea.right };
    let targetRatingTopY = cursorY + 12;
    if (ratingElement.relativeTo) {
      const relPos = resolveRelativePosition(
        ratingElement,
        ratingCols.right - ratingCols.left,
        24,
        elementBoundsMap,
        lastBounds,
        targetRatingTopY,
      );
      targetRatingTopY = relPos.y;
    }

    const endY = drawRatingBlock(
      ctx,
      {
        value: ratingElement.value,
        color: ratingElement.color,
        reviewCount: ratingElement.reviewCount ?? "",
      },
      targetRatingTopY,
      titleStyle.alignment,
      ratingCols,
    );

    const ratingBounds: ElementBounds = {
      id: ratingElement.id ?? "rating-main",
      role: "rating",
      type: "rating",
      x: ratingCols.left,
      y: targetRatingTopY,
      width: ratingCols.right - ratingCols.left,
      height: endY - targetRatingTopY,
    };
    elementBoundsMap.set(ratingBounds.id, ratingBounds);
    elementBoundsMap.set("rating", ratingBounds);
    lastBounds = ratingBounds;
  }

  if (hasOverlay && overlayImage && imageElement) {
    drawOverlayCard(ctx, imageElement, overlayImage);
  }
}
