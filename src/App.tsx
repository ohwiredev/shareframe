import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Hash, Monitor, MessageSquare } from "lucide-react";
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
import { SocialPreviewWrapper, type ViewMode } from "./components/SocialPreviewWrapper";
import { FEATURE_FLAGS } from "./config/flags";
import { ensureEditorFontsLoaded } from "./fonts/loadGoogleFont";
import { useHistory } from "./hooks/useHistory";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import type { ExtractedMetadata } from "./lib/websiteExtractor";
import { DEFAULT_EDITOR_STATE } from "./state/defaults";
import type {
  BadgeState,
  EditorState,
  LogoState,
  OverlayImageState,
  PriceState,
  RatingState,
  TextStyle,
} from "./state/types";
import { applyTemplate, BUILTIN_TEMPLATES, type OgTemplate } from "./templates";

import {
  badgeStateToBadgeElement,
  findBadgeElement,
  findImageElement,
  findLogoElement,
  findPriceElement,
  findRatingElement,
  findTextElement,
  imageElementToOverlayState,
  logoElementToLogoState,
  logoStateToLogoElement,
  normalizeState,
  overlayStateToImageElement,
  priceStateToPriceElement,
  ratingStateToRatingElement,
  setOrUpdateElement,
  textElementToTextStyle,
  textStyleToTextElement,
} from "./state/elementUtils";

export type ThemeMode = "light" | "dark";

function revokeLogo(src: string | null) {
  if (src?.startsWith("blob:")) URL.revokeObjectURL(src);
}

export default function App() {
  const {
    state: rawState,
    set: setState,
    replace: replaceState,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetHistory,
  } = useHistory<EditorState>("shareframe_editor_state", DEFAULT_EDITOR_STATE);

  const state = normalizeState(rawState);

  const logoState = logoElementToLogoState(findLogoElement(state));
  const imageState = imageElementToOverlayState(findImageElement(state));
  const titleState = textElementToTextStyle(findTextElement(state, "title"));
  const descriptionState = textElementToTextStyle(findTextElement(state, "description"));
  const badgeEl = findBadgeElement(state);
  const badgeState = badgeEl ? { text: badgeEl.text, color: badgeEl.color, background: badgeEl.background } : undefined;
  const priceEl = findPriceElement(state);
  const priceState = priceEl?.text ? { text: priceEl.text, color: priceEl.color, fontSize: priceEl.fontSize, yOffset: priceEl.yOffset } : undefined;
  const origPriceState = priceEl?.originalPriceText ? { text: priceEl.originalPriceText, color: priceEl.originalPriceColor ?? "#9ca3af", fontSize: priceEl.originalPriceFontSize } : undefined;
  const ratingEl = findRatingElement(state);
  const ratingState = ratingEl && ratingEl.value > 0 ? { value: ratingEl.value, color: ratingEl.color, reviewCount: ratingEl.reviewCount ?? "" } : undefined;

  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [panel, setPanel] = useState<EditorPanel>("templates");
  const [viewMode, setViewMode] = useState<ViewMode>("raw");
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

  useEffect(() => () => revokeLogo(logoState.src), [logoState.src]);
  useEffect(() => () => revokeLogo(imageState.src), [imageState.src]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  useEffect(() => {
    const templateFontStacks = BUILTIN_TEMPLATES.flatMap((t) => {
      const s = normalizeState(t.state);
      const title = findTextElement(s, "title");
      const desc = findTextElement(s, "description");
      return [title?.fontFamily, desc?.fontFamily];
    }).filter((s): s is string => Boolean(s));
    void ensureEditorFontsLoaded(templateFontStacks);
  }, []);

  const setLogo = (logo: LogoState) =>
    setState((currentRaw) => {
      const current = normalizeState(currentRaw);
      const currentLogo = findLogoElement(current);
      if (currentLogo?.src !== logo.src) revokeLogo(currentLogo?.src ?? null);
      return setOrUpdateElement(current, logoStateToLogoElement(logo));
    });

  const setImage = (image: OverlayImageState) =>
    setState((currentRaw) => {
      const current = normalizeState(currentRaw);
      const currentImage = findImageElement(current);
      if (currentImage?.src !== image.src) revokeLogo(currentImage?.src ?? null);
      return setOrUpdateElement(current, overlayStateToImageElement(image));
    });

  const setTitle = (title: TextStyle) =>
    setState((currentRaw) =>
      setOrUpdateElement(normalizeState(currentRaw), textStyleToTextElement("text-title", "title", title)),
    );

  const setDescription = (description: TextStyle) =>
    setState((currentRaw) =>
      setOrUpdateElement(
        normalizeState(currentRaw),
        textStyleToTextElement("text-description", "description", description),
      ),
    );

  const setBadge = (badge: BadgeState | undefined) =>
    setState((currentRaw) => {
      const current = normalizeState(currentRaw);
      if (!badge) {
        return {
          ...current,
          elements: current.elements.filter((el) => el.type !== "badge"),
        };
      }
      return setOrUpdateElement(current, badgeStateToBadgeElement(badge));
    });

  const setPrice = (price: PriceState | undefined) =>
    setState((currentRaw) => {
      const current = normalizeState(currentRaw);
      if (!price) {
        return {
          ...current,
          elements: current.elements.filter((el) => el.type !== "price"),
        };
      }
      return setOrUpdateElement(current, priceStateToPriceElement(price, origPriceState));
    });

  const setOriginalPrice = (originalPrice: PriceState | undefined) =>
    setState((currentRaw) => {
      const current = normalizeState(currentRaw);
      if (!priceState) return current;
      return setOrUpdateElement(current, priceStateToPriceElement(priceState, originalPrice));
    });

  const setRating = (rating: RatingState | undefined) =>
    setState((currentRaw) => {
      const current = normalizeState(currentRaw);
      if (!rating || rating.value <= 0) {
        return {
          ...current,
          elements: current.elements.filter((el) => el.type !== "rating"),
        };
      }
      return setOrUpdateElement(current, ratingStateToRatingElement(rating));
    });

  const handleApplyTemplate = (template: OgTemplate) => {
    replaceState((current) => {
      const next = applyTemplate(current, template);
      const nextImg = findImageElement(next);
      if ((!nextImg || !nextImg.enabled) && panel === "image") {
        setPanel("templates");
      }
      return next;
    });
  };

  const handleApplyExtractedToCanvas = (extracted: ExtractedMetadata) => {
    setState((currentRaw) => {
      const current = normalizeState(currentRaw);
      let updated = current;

      if (extracted.title) {
        const title = textElementToTextStyle(findTextElement(current, "title"));
        updated = setOrUpdateElement(
          updated,
          textStyleToTextElement("text-title", "title", { ...title, content: extracted.title }),
        );
      }
      if (extracted.description) {
        const desc = textElementToTextStyle(findTextElement(current, "description"));
        updated = setOrUpdateElement(
          updated,
          textStyleToTextElement("text-description", "description", { ...desc, content: extracted.description }),
        );
      }
      if (extracted.logoUrl) {
        const logo = logoElementToLogoState(findLogoElement(current));
        updated = setOrUpdateElement(
          updated,
          logoStateToLogoElement({ ...logo, src: extracted.logoUrl }),
        );
      }
      if (extracted.themeColor) {
        updated = {
          ...updated,
          background: { type: "solid", color: extracted.themeColor },
        };
      }

      return updated;
    });
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
    setLogo({ ...logoState, src: URL.createObjectURL(file) });
  };

  const removeLogo = () => {
    setLogo({ ...logoState, src: null });
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
    setImage({ ...imageState, src: URL.createObjectURL(file) });
  };

  const removeImage = () => {
    setImage({ ...imageState, src: null });
    setImageFileName("");
    if (imageFileRef.current) imageFileRef.current.value = "";
  };

  const reset = () => {
    revokeLogo(logoState.src);
    revokeLogo(imageState.src);
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
          showImagePanel={imageState.enabled}
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
              logo={logoState}
              fileName={fileName}
              fileRef={fileRef}
              onFileChange={chooseLogo}
              onLogoChange={setLogo}
              onRemove={removeLogo}
            />
          )}
          {panel === "text" && (
            <TextPanel
              title={titleState}
              description={descriptionState}
              badge={badgeState}
              price={priceState}
              originalPrice={origPriceState}
              rating={ratingState}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
              onBadgeChange={setBadge}
              onPriceChange={setPrice}
              onOriginalPriceChange={setOriginalPrice}
              onRatingChange={setRating}
            />
          )}
          {panel === "image" && (
            <OverlayImagePanel
              image={imageState}
              fileName={imageFileName}
              fileRef={imageFileRef}
              onFileChange={chooseImage}
              onImageChange={setImage}
              onRemove={removeImage}
            />
          )}
        </aside>

        <section className="d1-stage relative">
          <div className="absolute top-4 right-4 z-10 flex bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 border border-neutral-200 dark:border-neutral-700 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("raw")}
              className={`p-2 rounded-md transition-colors ${viewMode === "raw" ? "bg-white dark:bg-neutral-700 shadow-sm" : "hover:bg-neutral-200 dark:hover:bg-neutral-700/50"}`}
              title="Raw Image"
            >
              <Monitor className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("twitter")}
              className={`p-2 rounded-md transition-colors ${viewMode === "twitter" ? "bg-white dark:bg-neutral-700 shadow-sm" : "hover:bg-neutral-200 dark:hover:bg-neutral-700/50"}`}
              title="Twitter Preview"
            >
              <MessageSquare className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("slack")}
              className={`p-2 rounded-md transition-colors ${viewMode === "slack" ? "bg-white dark:bg-neutral-700 shadow-sm" : "hover:bg-neutral-200 dark:hover:bg-neutral-700/50"}`}
              title="Slack Preview"
            >
              <Hash className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            </button>
          </div>

          <div className="w-full h-full flex flex-col items-center justify-center overflow-y-auto">
            <SocialPreviewWrapper viewMode={viewMode}>
              <div className="functional-preview shrink-0">
                <OgCanvas
                  state={state}
                  onPipelineReady={setPipeline}
                  onRenderError={handleRenderError}
                  onRenderSuccess={handleRenderSuccess}
                />
              </div>
            </SocialPreviewWrapper>
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
