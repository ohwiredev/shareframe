export type HorizontalAlignment = "left" | "center" | "right";

export type SolidBackground = {
  type: "solid";
  color: string;
};

/** Linear (default) or radial background fill. */
export type GradientStyle = "linear" | "radial";

/**
 * Gradient background.
 * Existing templates omit `style` and use `angle` + `colors` (linear, evenly spaced).
 * Radial presets set `style: "radial"` with center/radius; optional `stops` match CSS offsets.
 */
export type GradientBackground = {
  type: "gradient";
  /** Defaults to `"linear"` when omitted. */
  style?: GradientStyle;
  /** Linear angle in degrees. Used when style is linear (default 135). */
  angle?: number;
  /** Radial center X as a fraction of canvas width (0–1). Default 0.5. */
  cx?: number;
  /** Radial center Y as a fraction of canvas height (0–1). Default 0.5. */
  cy?: number;
  /**
   * Radial radius on the 1200×630 canvas.
   * `"farthest-corner"` matches CSS; a number is absolute pixels.
   */
  radius?: "farthest-corner" | number;
  colors: string[];
  /** Optional stop offsets 0–1 aligned with `colors`. Evenly spaced when omitted. */
  stops?: number[];
};

export type Background = SolidBackground | GradientBackground;

/** Typography settings shared by title and description. */
export type TextStyle = {
  content: string;
  fontFamily: string;
  fontSize: number;
  /** Percentage of the canvas safe width available for line wrapping. */
  width: number;
  fontWeight: number;
  color: string;
  alignment: HorizontalAlignment;
  /** Vertical offset adjustment in pixels (-200 to 200). */
  yOffset: number;
};

/** Logo placement on the 1200×630 canvas. */
export type LogoState = {
  /** Object URL or data URL once a file is loaded; null when none. */
  src: string | null;
  /** Vertical position as a fraction of canvas height (0–1). */
  y: number;
  /** Scale relative to a default logo size (1 = 100%). */
  scale: number;
  /** Horizontal placement within the canvas safe area. */
  alignment: HorizontalAlignment;
};

/** Overlay image placement mode on the 1200x630 canvas. */
export type OverlayPosition = "bottom" | "right" | "left";

/** Overlay image card settings (feature screenshot, mockup, or photo). */
export type OverlayImageState = {
  /** Whether this template supports an overlay image. */
  enabled: boolean;
  /** Object URL, data URL, or preset image URL; null when none. */
  src: string | null;
  /** Positioning layout relative to text: bottom card vs split right/left. */
  position: OverlayPosition;
  /** Scale factor relative to the allocated image slot (0.4 - 1.2). */
  scale: number;
  /** Corner radius in canvas pixels (0 - 48). */
  borderRadius: number;
  /** Whether to render drop shadow around the card frame. */
  shadow: boolean;
  /** Shadow blur intensity (0 - 64). */
  shadowBlur: number;
  /** Vertical offset adjustment in pixels (-80 to 80). */
  yOffset: number;
};

/** E-commerce badge overlay (e.g. "BESTSELLER", "NEW", "SALE"). */
export type BadgeState = {
  text: string;
  /** Text color. */
  color: string;
  /** Badge pill background color. */
  background: string;
};

/** E-commerce display price (e.g. "$199"). */
export type PriceState = {
  text: string;
  color: string;
  fontSize?: number;
  yOffset?: number;
};

/** E-commerce star rating with optional review count. */
export type RatingState = {
  /** Star value 0–5, supports halves (e.g. 4.5). */
  value: number;
  /** Filled star color. */
  color: string;
  /** Display string like "256 reviews". */
  reviewCount: string;
};

export type CanvasElementType =
  | "text"
  | "image"
  | "logo"
  | "badge"
  | "price"
  | "rating"
  | "shape";

export type BaseCanvasElement = {
  id: string;
  type: CanvasElementType;
  visible?: boolean;
  x?: number;
  y?: number;
  zIndex?: number;
};

export type TextElementRole = "title" | "description" | "custom";

export type TextElement = BaseCanvasElement & {
  type: "text";
  role?: TextElementRole;
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  alignment: HorizontalAlignment;
  width: number;
  yOffset?: number;
};

export type ImageElement = BaseCanvasElement & {
  type: "image";
  role?: "overlay" | "custom";
  enabled?: boolean;
  src: string | null;
  position?: OverlayPosition;
  scale: number;
  borderRadius: number;
  shadow: boolean;
  shadowBlur: number;
  yOffset?: number;
};

export type LogoElement = BaseCanvasElement & {
  type: "logo";
  src: string | null;
  y: number;
  scale: number;
  alignment: HorizontalAlignment;
};

export type BadgeElement = BaseCanvasElement & {
  type: "badge";
  text: string;
  color: string;
  background: string;
};

export type PriceElement = BaseCanvasElement & {
  type: "price";
  text: string;
  color: string;
  fontSize?: number;
  originalPriceText?: string;
  originalPriceColor?: string;
  originalPriceFontSize?: number;
  yOffset?: number;
};

export type RatingElement = BaseCanvasElement & {
  type: "rating";
  value: number;
  color: string;
  reviewCount?: string;
};

export type ShapeElement = BaseCanvasElement & {
  type: "shape";
  shapeType: "rectangle" | "circle" | "line";
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  width: number;
  height: number;
  borderRadius?: number;
};

export type CanvasElement =
  | TextElement
  | ImageElement
  | LogoElement
  | BadgeElement
  | PriceElement
  | RatingElement
  | ShapeElement;

/**
 * Single-source editor state.
 * Controls and canvas both read/write this declarative shape.
 */
export type EditorState = {
  background: Background;
  elements: CanvasElement[];
  /** Optional legacy fields preserved for backwards compatibility during transition */
  logo?: LogoState;
  title?: TextStyle;
  description?: TextStyle;
  image?: OverlayImageState;
  badge?: BadgeState;
  price?: PriceState;
  originalPrice?: PriceState;
  rating?: RatingState;
};
