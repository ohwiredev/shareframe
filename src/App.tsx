import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { copyImageToClipboard, isClipboardSupported } from "./canvas/clipboard";
import { type ExportFormat, exportImage } from "./canvas/exportCanvas";
import type { RenderPipeline } from "./canvas/renderPipeline";
import { AppHeader } from "./components/AppHeader";
import { BatchOgGeneratorModal } from "./components/controls/BatchOgGeneratorModal";
import { CanvasPanel } from "./components/controls/CanvasPanel";
import { LogoPanel } from "./components/controls/LogoPanel";
import { OverlayImagePanel } from "./components/controls/OverlayImagePanel";
import { TemplatePanel } from "./components/controls/TemplatePanel";
import { TextPanel } from "./components/controls/TextPanel";
import { UrlImportModal } from "./components/controls/UrlImportModal";
import { EditorNavigation, type EditorPanel } from "./components/EditorNavigation";
import { OgCanvas } from "./components/OgCanvas";
import { FEATURE_FLAGS } from "./config/flags";
import { ensureEditorFontsLoaded } from "./fonts/loadGoogleFont";
import { useHistory } from "./hooks/useHistory";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import type { ExtractedMetadata } from "./lib/websiteExtractor";
import { DEFAULT_EDITOR_STATE } from "./state/defaults";
import type { EditorState, LogoState, OverlayImageState, TextStyle } from "./state/types";
import { applyTemplate, BUILTIN_TEMPLATES, type OgTemplate } from "./templates";

export type ThemeMode = "light" | "dark";

function revokeLogo(src: string | null) {
  if (src?.startsWith("blob:")) URL.revokeObjectURL(src);
}

export default function App() {
  const {
    state,
    set: setState,
    replace: replaceState,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetHistory,
  } = useHistory<EditorState>(DEFAULT_EDITOR_STATE);

  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [panel, setPanel] = useState<EditorPanel>("templates");
  const [exportOpen, setExportOpen] = useState(false);
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [extractedMetadata, setExtractedMetadata] = useState<ExtractedMetadata | null>(null);

  const [fileName, setFileName] = useState("");
  const [imageFileName, setImageFileName] = useState("");
  const [exporting, setExporting] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);
  const pipelineRef = useRef<RenderPipeline | null>(null);

  useEffect(() => () => revokeLogo(state.logo.src), [state.logo.src]);
  useEffect(() => () => revokeLogo(state.image.src), [state.image.src]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  useEffect(() => {
    const templateFontStacks = BUILTIN_TEMPLATES.flatMap((t) => [
      t.state.title?.fontFamily,
      t.state.description?.fontFamily,
    ]).filter((s): s is string => Boolean(s));
    void ensureEditorFontsLoaded(templateFontStacks);
  }, []);

  const setLogo = (logo: LogoState) =>
    setState((current) => {
      if (current.logo.src !== logo.src) revokeLogo(current.logo.src);
      return { ...current, logo };
    });
  const setImage = (image: OverlayImageState) =>
    setState((current) => {
      if (current.image.src !== image.src) revokeLogo(current.image.src);
      return { ...current, image };
    });
  const setTitle = (title: TextStyle) => setState((current) => ({ ...current, title }));
  const setDescription = (description: TextStyle) =>
    setState((current) => ({ ...current, description }));

  const handleApplyTemplate = (template: OgTemplate) => {
    replaceState((current) => {
      const next = applyTemplate(current, template);
      if (!next.image.enabled && panel === "image") {
        setPanel("templates");
      }
      return next;
    });
  };

  const handleApplyExtractedToCanvas = (extracted: ExtractedMetadata) => {
    setState((current) => ({
      ...current,
      title: {
        ...current.title,
        content: extracted.title,
      },
      description: {
        ...current.description,
        content: extracted.description,
      },
      logo: extracted.logoUrl
        ? {
            ...current.logo,
            src: extracted.logoUrl,
          }
        : current.logo,
      background: extracted.themeColor
        ? {
            type: "solid",
            color: extracted.themeColor,
          }
        : current.background,
    }));
  };

  const handleOpenBatchMode = (extracted: ExtractedMetadata) => {
    setExtractedMetadata(extracted);
    setBatchModalOpen(true);
  };

  const chooseLogo = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      toast.error("Choose an image file smaller than 5 MB.");
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

  const chooseImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      toast.error("Choose an image file smaller than 5 MB.");
      return;
    }
    setImageFileName(file.name);
    setImage({ ...state.image, src: URL.createObjectURL(file) });
  };

  const removeImage = () => {
    setImage({ ...state.image, src: null });
    setImageFileName("");
    if (imageFileRef.current) imageFileRef.current.value = "";
  };

  const reset = () => {
    revokeLogo(state.logo.src);
    revokeLogo(state.image.src);
    setFileName("");
    setImageFileName("");
    if (fileRef.current) fileRef.current.value = "";
    if (imageFileRef.current) imageFileRef.current.value = "";
    resetHistory(DEFAULT_EDITOR_STATE);
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

  const download = useCallback(
    (format: ExportFormat) => {
      const pipeline = pipelineRef.current;
      if (!pipeline || exporting) {
        if (!pipeline) setRenderError("The image renderer is not ready yet.");
        return;
      }

      setExporting(true);
      setRenderError(null);
      setExportOpen(false);
      void exportImage(pipeline, state, format)
        .then(() => {
          toast.success(`Exported as ${format.toUpperCase()}`);
        })
        .catch((error) => {
          const message =
            error instanceof Error ? error.message : "The image could not be exported.";
          console.error("[shareframe] Export failed", error);
          toast.error(message);
          setRenderError(message);
        })
        .finally(() => setExporting(false));
    },
    [exporting, state],
  );

  const copyToClipboard = useCallback(() => {
    const pipeline = pipelineRef.current;
    if (!pipeline || exporting) return;

    setExporting(true);
    void copyImageToClipboard(pipeline, state)
      .then(() => {
        toast.success("Copied to clipboard");
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Could not copy to clipboard.";
        toast.error(message);
      })
      .finally(() => setExporting(false));
  }, [state, exporting]);

  useKeyboardShortcuts(
    useMemo(
      () => ({
        "ctrl+z": undo,
        "ctrl+shift+z": redo,
        "ctrl+s": () => download("png"),
        "ctrl+shift+e": () => setExportOpen(true),
        "ctrl+shift+c": copyToClipboard,
      }),
      [undo, redo, copyToClipboard, download],
    ),
  );

  return (
    <div className={`d1 production-studio ${theme === "light" ? "studio-light" : ""}`}>
      <AppHeader
        theme={theme}
        exportOpen={exportOpen}
        exporting={exporting}
        canUndo={canUndo}
        canRedo={canRedo}
        clipboardSupported={isClipboardSupported()}
        onUndo={undo}
        onRedo={redo}
        onReset={reset}
        onThemeToggle={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        onOpenUrlImport={() => setUrlModalOpen(true)}
        onExportOpenChange={setExportOpen}
        onExport={download}
        onCopy={copyToClipboard}
      />

      <main className="d1-grid">
        <EditorNavigation
          activePanel={panel}
          showImagePanel={state.image.enabled}
          onPanelChange={setPanel}
        />

        <aside className="d1-panel">
          {panel === "templates" && (
            <TemplatePanel currentState={state} onApplyTemplate={handleApplyTemplate} />
          )}
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
          {panel === "image" && (
            <OverlayImagePanel
              image={state.image}
              fileName={imageFileName}
              fileRef={imageFileRef}
              onFileChange={chooseImage}
              onImageChange={setImage}
              onRemove={removeImage}
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

      {FEATURE_FLAGS.ENABLE_WEBSITE_IMPORT && (
        <>
          <UrlImportModal
            isOpen={urlModalOpen}
            onClose={() => setUrlModalOpen(false)}
            onApplyToCanvas={handleApplyExtractedToCanvas}
            onOpenBatchMode={handleOpenBatchMode}
          />

          <BatchOgGeneratorModal
            isOpen={batchModalOpen}
            onClose={() => setBatchModalOpen(false)}
            extracted={extractedMetadata}
            baseState={state}
            pipeline={pipelineRef.current}
            onSelectLinkForCanvas={(selectedState) => setState(selectedState)}
          />
        </>
      )}
    </div>
  );
}
