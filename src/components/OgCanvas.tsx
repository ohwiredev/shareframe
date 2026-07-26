import { memo, useEffect, useRef, useState } from "react";
import { drawOgImage } from "../canvas/drawOgImage";
import { useEditorFonts } from "../hooks/useEditorFonts";
import { OG_HEIGHT, OG_WIDTH } from "../state/constants";
import type { EditorState } from "../state/types";

type OgCanvasProps = {
  state: EditorState;
};

/**
 * Fixed 1200×630 canvas. CSS scales it to fit the preview frame;
 * pixel buffer stays full resolution for export.
 */
export const OgCanvas = memo(function OgCanvas({ state }: OgCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const fontGeneration = useEditorFonts(state);
  const stateRef = useRef(state);
  stateRef.current = state;
  const logoRef = useRef(logoImage);
  logoRef.current = logoImage;

  // Decode logo whenever src changes.
  useEffect(() => {
    const src = state.logo.src;
    if (!src) {
      setLogoImage(null);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (!cancelled) {
        setLogoImage(img);
      }
    };
    img.onerror = () => {
      if (!cancelled) {
        setLogoImage(null);
      }
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [state.logo.src]);

  // Live redraw — rAF-coalesced so rapid color/slider updates draw once per frame.
  useEffect(() => {
    let rafId = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      drawOgImage(ctx, stateRef.current, { logoImage: logoRef.current });
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [state, logoImage, fontGeneration]);

  return (
    <canvas
      ref={canvasRef}
      className="og-canvas"
      width={OG_WIDTH}
      height={OG_HEIGHT}
      role="img"
      aria-label="Open Graph image preview"
    />
  );
});
