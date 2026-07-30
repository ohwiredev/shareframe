import { memo, useEffect, useRef } from "react";
import { createRenderPipeline, type RenderPipeline } from "../canvas/renderPipeline";
import { useEditorFonts } from "../hooks/useEditorFonts";
import { OG_HEIGHT, OG_WIDTH } from "../state/constants";
import type { EditorState } from "../state/types";

type OgCanvasProps = {
  state: EditorState;
  onPipelineReady: (pipeline: RenderPipeline | null) => void;
  onRenderError: (error: Error) => void;
  onRenderSuccess: () => void;
};

function requestedBackend(): "auto" | "worker" | "main" {
  const backend = new URLSearchParams(window.location.search).get("renderer");
  return backend === "worker" || backend === "main" ? backend : "auto";
}

export const OgCanvas = memo(function OgCanvas({
  state,
  onPipelineReady,
  onRenderError,
  onRenderSuccess,
}: OgCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pipelineRef = useRef<RenderPipeline | null>(null);
  const fontGeneration = useEditorFonts(state);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let pipeline: RenderPipeline;
    try {
      pipeline = createRenderPipeline(canvas, {
        backend: requestedBackend(),
        onError: onRenderError,
        onRendered: onRenderSuccess,
      });
    } catch (error) {
      onRenderError(
        error instanceof Error ? error : new Error("The canvas could not be initialized."),
      );
      return;
    }

    pipelineRef.current = pipeline;
    onPipelineReady(pipeline);
    return () => {
      pipeline.dispose();
      pipelineRef.current = null;
      onPipelineReady(null);
    };
  }, [onPipelineReady, onRenderError, onRenderSuccess]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: fontGeneration triggers a re-render when a font is loaded
  useEffect(() => {
    pipelineRef.current?.render(state);
  }, [state, fontGeneration]);

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
