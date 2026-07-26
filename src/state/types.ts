export type HorizontalAlignment = "left" | "center" | "right";

export type SolidBackground = {
  type: "solid";
  color: string;
};

export type GradientBackground = {
  type: "gradient";
  angle: number;
  colors: [string, string];
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

/**
 * Single-source editor state.
 * Controls and canvas both read/write this shape.
 */
export type EditorState = {
  background: Background;
  logo: LogoState;
  title: TextStyle;
  description: TextStyle;
};
