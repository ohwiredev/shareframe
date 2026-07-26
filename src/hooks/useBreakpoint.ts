import { useMediaQuery } from "@astryxdesign/core/hooks";

/**
 * Responsive contract (frame root):
 *   > 1280px  controls 360 | preview | export 256
 *   ≤ 1280px  controls 360 | preview  (export via top-nav / dialog)
 *   ≤ 768px   preview full width; compose + export open as dialogs
 *
 * `serverDefault` true assumes a desktop-first first paint for this SPA
 * (avoids a mobile-layout flash on wide screens before matchMedia runs).
 */
export function useBreakpoint() {
  const isDesktop = useMediaQuery("(min-width: 769px)", true);
  const isWide = useMediaQuery("(min-width: 1281px)", true);

  return {
    /** Side compose panel visible (tablet and up). */
    isDesktop,
    /** Side export panel visible (wide desktop only). */
    isWide,
    /** Phone / narrow — use dialogs for compose & export. */
    isMobile: !isDesktop,
    /** Export docked in side panel. */
    showExportPanel: isWide,
    /** Compose docked in side panel. */
    showControlsPanel: isDesktop,
  };
}
