import { useEffect, useState } from "react";
import { ensureEditorFontsLoaded } from "../fonts/loadGoogleFont";
import { normalizeState } from "../state/elementUtils";
import type { EditorState } from "../state/types";

/**
 * Loads Google Fonts used by the editor and bumps a generation when ready
 * so the canvas can redraw with real metrics (not fallback faces).
 */
export function useEditorFonts(rawState: EditorState): number {
  const [fontGeneration, setFontGeneration] = useState(0);

  const state = normalizeState(rawState);
  const families = state.elements
    .filter(
      (el): el is typeof el & { fontFamily: string } =>
        el.type === "text" && Boolean(el.fontFamily),
    )
    .map((el) => el.fontFamily);
  const familyKey = families.join("::");

  useEffect(() => {
    let cancelled = false;

    const list = familyKey ? familyKey.split("::") : [];
    void ensureEditorFontsLoaded(list).then(() => {
      if (!cancelled) {
        setFontGeneration((n) => n + 1);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [familyKey]);

  return fontGeneration;
}
