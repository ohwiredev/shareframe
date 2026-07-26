import { useCallback, useEffect, useRef, useState } from "react";
import { exportImage, type ExportFormat } from "./canvas/exportCanvas";
import type { RenderPipeline } from "./canvas/renderPipeline";
import { AppHeader } from "./components/AppHeader";
import { EditorNavigation, type EditorPanel } from "./components/EditorNavigation";
import { OgCanvas } from "./components/OgCanvas";
import { CanvasPanel } from "./components/controls/CanvasPanel";
import { LogoPanel } from "./components/controls/LogoPanel";
import { TextPanel } from "./components/controls/TextPanel";
import { DEFAULT_EDITOR_STATE } from "./state/defaults";
import type { EditorState, LogoState, TextStyle } from "./state/types";

export type ThemeMode = "light" | "dark";

function revokeLogo(src: string | null) {
  if (src?.startsWith("blob:")) URL.revokeObjectURL(src);
}

export default function App() {
  const [state, setState] = useState<EditorState>(DEFAULT_EDITOR_STATE);
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [panel, setPanel] = useState<EditorPanel>("canvas");
  const [exportOpen, setExportOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [exporting, setExporting] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pipelineRef = useRef<RenderPipeline | null>(null);

  useEffect(() => () => revokeLogo(state.logo.src), [state.logo.src]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const setLogo = (logo: LogoState) =>
    setState((current) => {
      if (current.logo.src !== logo.src) revokeLogo(current.logo.src);
      return { ...current, logo };
    });
  const setTitle = (title: TextStyle) => setState((current) => ({ ...current, title }));
  const setDescription = (description: TextStyle) =>
    setState((current) => ({ ...current, description }));

  const chooseLogo = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      window.alert("Choose an image file smaller than 5 MB.");
      return;
    }
    setFileName(file.name);
    setLogo({ ...state.logo, src: URL.createObjectURL(file) });
  };

  const removeLogo = () => {
    setLogo({ ...state.logo, src: null });
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const reset = () => {
    revokeLogo(state.logo.src);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
    setState(DEFAULT_EDITOR_STATE);
  };

  const setPipeline = useCallback((pipeline: RenderPipeline | null) => {
    pipelineRef.current = pipeline;
  }, []);
  const handleRenderError = useCallback((error: Error) => {
    console.error("[shareframe] Render failed", error);
    setRenderError(error.message);
  }, []);
  const handleRenderSuccess = useCallback(() => {
    setRenderError(null);
  }, []);

  const download = (format: ExportFormat) => {
    const pipeline = pipelineRef.current;
    if (!pipeline || exporting) {
      if (!pipeline) setRenderError("The image renderer is not ready yet.");
      return;
    }

    setExporting(true);
    setRenderError(null);
    setExportOpen(false);
    void exportImage(pipeline, state, format)
      .catch((error) => {
        const message =
          error instanceof Error
            ? error.message
            : "The image could not be exported.";
        console.error("[shareframe] Export failed", error);
        setRenderError(message);
      })
      .finally(() => setExporting(false));
  };

  return (
    <div className={`d1 production-studio ${theme === "light" ? "studio-light" : ""}`}>
      <AppHeader
        theme={theme}
        exportOpen={exportOpen}
        exporting={exporting}
        onReset={reset}
        onThemeToggle={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        onExportOpenChange={setExportOpen}
        onExport={download}
      />

      <main className="d1-grid">
        <EditorNavigation activePanel={panel} onPanelChange={setPanel} />

        <aside className="d1-panel">
          {panel === "canvas" && (
            <CanvasPanel
              background={state.background}
              onChange={(background) => setState((current) => ({ ...current, background }))}
            />
          )}
          {panel === "logo" && (
            <LogoPanel
              logo={state.logo}
              fileName={fileName}
              fileRef={fileRef}
              onFileChange={chooseLogo}
              onLogoChange={setLogo}
              onRemove={removeLogo}
            />
          )}
          {panel === "text" && (
            <TextPanel
              title={state.title}
              description={state.description}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
            />
          )}
        </aside>

        <section className="d1-stage">
          <div className="functional-preview">
            <OgCanvas
              state={state}
              onPipelineReady={setPipeline}
              onRenderError={handleRenderError}
              onRenderSuccess={handleRenderSuccess}
            />
          </div>
          {renderError && (
            <p className="render-error" role="alert">
              {renderError}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
