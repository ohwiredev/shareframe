import { useCallback, useState } from "react";
import { Theme, type ThemeMode } from "@astryxdesign/core/theme";
import { AppShell } from "@astryxdesign/core/AppShell";
import { Layout } from "@astryxdesign/core/Layout";
import {
  exportCanvas,
  getOgCanvas,
  type ExportFormat,
} from "./canvas/exportCanvas";
import { AppTopNav } from "./components/AppTopNav";
import { ComposeDialog } from "./components/ComposeDialog";
import { ControlsPanel } from "./components/ControlsPanel";
import { ExportDialog } from "./components/ExportDialog";
import { ExportPanel } from "./components/ExportPanel";
import { PreviewPane } from "./components/PreviewPane";
import { useBreakpoint } from "./hooks/useBreakpoint";
import { DEFAULT_EDITOR_STATE } from "./state/defaults";
import type { EditorState, LogoState, TextStyle } from "./state/types";
import { ogSnapTheme } from "./theme/ogSnapTheme";

function revokeLogoSrc(src: string | null | undefined) {
  if (src?.startsWith("blob:")) {
    URL.revokeObjectURL(src);
  }
}

/**
 * OGSnap root — single editor state drives controls and canvas.
 *
 * Responsive contract (frame root):
 *   > 1280px  controls 360 | preview | export 256
 *   ≤ 1280px  controls 360 | preview  (export via dialog)
 *   ≤ 768px   preview full width; compose + export via dialogs
 */
function App() {
  const [state, setState] = useState<EditorState>(DEFAULT_EDITOR_STATE);
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const [composeOpen, setComposeOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const { showControlsPanel, showExportPanel, isMobile } = useBreakpoint();

  const onBackgroundChange = useCallback((backgroundColor: string) => {
    setState((prev) =>
      prev.backgroundColor === backgroundColor
        ? prev
        : { ...prev, backgroundColor },
    );
  }, []);

  const onLogoChange = useCallback((logo: LogoState) => {
    setState((prev) => {
      if (prev.logo === logo) {
        return prev;
      }
      if (prev.logo.src && prev.logo.src !== logo.src) {
        revokeLogoSrc(prev.logo.src);
      }
      return { ...prev, logo };
    });
  }, []);

  const onTitleChange = useCallback((title: TextStyle) => {
    setState((prev) => (prev.title === title ? prev : { ...prev, title }));
  }, []);

  const onDescriptionChange = useCallback((description: TextStyle) => {
    setState((prev) =>
      prev.description === description ? prev : { ...prev, description },
    );
  }, []);

  const onReset = useCallback(() => {
    setState((prev) => {
      revokeLogoSrc(prev.logo.src);
      return DEFAULT_EDITOR_STATE;
    });
  }, []);

  const onExport = useCallback((format: ExportFormat) => {
    const canvas = getOgCanvas();
    if (!canvas) {
      console.warn("[og-snap] Export failed: canvas not found");
      return;
    }
    exportCanvas(canvas, format);
  }, []);

  return (
    <Theme theme={ogSnapTheme} mode={themeMode}>
      <AppShell
        height="fill"
        contentPadding={0}
        variant="section"
        topNav={
          <AppTopNav
            onReset={onReset}
            themeMode={themeMode}
            onThemeModeChange={setThemeMode}
            showEditAction={isMobile}
            onOpenEdit={() => setComposeOpen(true)}
            showExportAction={!showExportPanel}
            onOpenExport={() => setExportOpen(true)}
          />
        }
      >
        <Layout
          height="fill"
          start={
            showControlsPanel ? (
              <ControlsPanel
                state={state}
                onBackgroundChange={onBackgroundChange}
                onLogoChange={onLogoChange}
                onTitleChange={onTitleChange}
                onDescriptionChange={onDescriptionChange}
              />
            ) : undefined
          }
          content={
            <PreviewPane
              state={state}
              compact={isMobile}
              showMobileActions={isMobile}
              onOpenEdit={() => setComposeOpen(true)}
              onOpenExport={() => setExportOpen(true)}
            />
          }
          end={
            showExportPanel ? <ExportPanel onExport={onExport} /> : undefined
          }
        />
      </AppShell>

      <ComposeDialog
        isOpen={composeOpen}
        onOpenChange={setComposeOpen}
        state={state}
        onBackgroundChange={onBackgroundChange}
        onLogoChange={onLogoChange}
        onTitleChange={onTitleChange}
        onDescriptionChange={onDescriptionChange}
      />

      <ExportDialog
        isOpen={exportOpen}
        onOpenChange={setExportOpen}
        onExport={onExport}
      />
    </Theme>
  );
}

export default App;
