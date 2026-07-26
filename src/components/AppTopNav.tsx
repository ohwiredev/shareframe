import { TopNav, TopNavHeading } from "@astryxdesign/core/TopNav";
import { Button } from "@astryxdesign/core/Button";
import { HStack } from "@astryxdesign/core/Layout";
import { Text } from "@astryxdesign/core/Text";
import type { ThemeMode } from "@astryxdesign/core/theme";
import { Moon, Sun } from "lucide-react";

type AppTopNavProps = {
  onReset: () => void;
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
  /** Show Export trigger when the side export panel is hidden. */
  showExportAction?: boolean;
  onOpenExport?: () => void;
  /** Show Edit trigger on mobile when compose is in a dialog. */
  showEditAction?: boolean;
  onOpenEdit?: () => void;
};

export function AppTopNav({
  onReset,
  themeMode,
  onThemeModeChange,
  showExportAction = false,
  onOpenExport,
  showEditAction = false,
  onOpenEdit,
}: AppTopNavProps) {
  const nextMode: ThemeMode = themeMode === "dark" ? "light" : "dark";

  return (
    <TopNav
      label="OGSnap navigation"
      heading={
        <TopNavHeading heading="OGSnap" subheading="Open Graph Studio" />
      }
      endContent={
        <HStack gap={2} vAlign="center" wrap="wrap" className="top-nav-actions">
          <Text type="supporting" color="secondary">
            1200 × 630
          </Text>
          {showEditAction ? (
            <Button
              label="Edit"
              variant="secondary"
              size="sm"
              onClick={onOpenEdit}
            />
          ) : null}
          {showExportAction ? (
            <Button
              label="Export"
              variant="primary"
              size="sm"
              onClick={onOpenExport}
            />
          ) : null}
          <Button
            label={themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            variant="ghost"
            size="sm"
            icon={
              themeMode === "dark" ? (
                <Sun size="1em" aria-hidden="true" />
              ) : (
                <Moon size="1em" aria-hidden="true" />
              )
            }
            isIconOnly
            tooltip={`Switch to ${nextMode} mode`}
            onClick={() => onThemeModeChange(nextMode)}
          />
          <Button label="Reset" variant="ghost" size="sm" onClick={onReset} />
        </HStack>
      }
    />
  );
}
