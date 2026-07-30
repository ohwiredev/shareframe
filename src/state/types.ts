export type HorizontalAlignment = "left" | "center" | "right";

export type SolidBackground = {
  type: "solid";
  color: string;
};

export type GradientBackground = {
  type: "gradient";
  angle: number;
  colors: string[];
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

/**
 * Single-source editor state.
 * Controls and canvas both read/write this shape.
 */
export type EditorState = {
  background: Background;
  logo: LogoState;
  title: TextStyle;
  description: TextStyle;
  image: OverlayImageState;
};
