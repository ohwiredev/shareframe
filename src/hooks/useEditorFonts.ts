import { useEffect, useState } from "react";
import { ensureEditorFontsLoaded } from "../fonts/loadGoogleFont";
import type { EditorState } from "../state/types";

/**
 * Loads Google Fonts used by the editor and bumps a generation when ready
 * so the canvas can redraw with real metrics (not fallback faces).
 */
export function useEditorFonts(state: EditorState): number {
  const [fontGeneration, setFontGeneration] = useState(0);

  const titleFamily = state.title.fontFamily;
  const descriptionFamily = state.description.fontFamily;

  useEffect(() => {
    let cancelled = false;

    void ensureEditorFontsLoaded([titleFamily, descriptionFamily]).then(() => {
      if (!cancelled) {
        setFontGeneration((n) => n + 1);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [titleFamily, descriptionFamily]);

  return fontGeneration;
}
