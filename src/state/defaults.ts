import type { EditorState } from "./types";

export const DEFAULT_EDITOR_STATE: EditorState = {
  background: {
    type: "solid",
    color: "#1a1a2e",
  },
  logo: {
    src: null,
    y: 0.28,
    scale: 1,
    alignment: "center",
  },
  title: {
    content: "Your title here",
    fontFamily: "system-ui, sans-serif",
    fontSize: 64,
    width: 100,
    fontWeight: 700,
    color: "#ffffff",
    alignment: "center",
    yOffset: 0,
  },
  description: {
    content: "A short description for social previews.",
    fontFamily: "system-ui, sans-serif",
    fontSize: 28,
    width: 78,
    fontWeight: 400,
    color: "#c8c8d4",
    alignment: "center",
    yOffset: 0,
  },
  image: {
    enabled: false,
    src: null,
    position: "bottom",
    scale: 1,
    borderRadius: 20,
    shadow: true,
    shadowBlur: 32,
    yOffset: 0,
  },
};
