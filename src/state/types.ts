/** Typography settings shared by title and description. */
export type TextStyle = {
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
};

/** Logo placement on the 1200×630 canvas. */
export type LogoState = {
  /** Object URL or data URL once a file is loaded; null when none. */
  src: string | null;
  /** Horizontal position as a fraction of canvas width (0–1). */
  x: number;
  /** Vertical position as a fraction of canvas height (0–1). */
  y: number;
  /** Scale relative to a default logo size (1 = 100%). */
  scale: number;
};

/**
 * Single-source editor state.
 * Controls and canvas both read/write this shape.
 */
export type EditorState = {
  backgroundColor: string;
  logo: LogoState;
  title: TextStyle;
  description: TextStyle;
};
