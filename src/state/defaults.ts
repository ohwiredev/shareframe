import type { EditorState } from "./types";

export const DEFAULT_EDITOR_STATE: EditorState = {
  backgroundColor: "#1a1a2e",
  logo: {
    src: null,
    x: 0.5,
    y: 0.28,
    scale: 1,
  },
  title: {
    content: "Your title here",
    fontFamily: "system-ui, sans-serif",
    fontSize: 64,
    fontWeight: 700,
    color: "#ffffff",
  },
  description: {
    content: "A short description for social previews.",
    fontFamily: "system-ui, sans-serif",
    fontSize: 28,
    fontWeight: 400,
    color: "#c8c8d4",
  },
};
