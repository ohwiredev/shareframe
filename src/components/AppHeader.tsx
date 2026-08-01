import {
  ArrowDownToLine,
  Clipboard,
  Globe,
  Moon,
  Redo2,
  RotateCcw,
  Sun,
  Undo2,
  WandSparkles,
} from "lucide-react";
import type { ThemeMode } from "../App";
import type { ExportFormat } from "../canvas/exportCanvas";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

type AppHeaderProps = {
  theme: ThemeMode;
  exportOpen: boolean;
  exporting: boolean;
  canUndo: boolean;
  canRedo: boolean;
  clipboardSupported: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onThemeToggle: () => void;
  onOpenUrlImport: () => void;
  onExportOpenChange: (open: boolean) => void;
  onExport: (format: ExportFormat) => void;
  onCopy: () => void;
};

const formats: Array<{
  id: ExportFormat;
  description: string;
}> = [
  { id: "png", description: "Best quality" },
  { id: "jpg", description: "Small file" },
  { id: "webp", description: "Modern format" },
];

export function AppHeader({
  theme,
  exportOpen,
  exporting,
  canUndo,
  canRedo,
  clipboardSupported,
  onUndo,
  onRedo,
  onReset,
  onThemeToggle,
  onOpenUrlImport,
  onExportOpenChange,
  onExport,
  onCopy,
}: AppHeaderProps) {
  return (
    <header className="d1-header">
      <div className="brand brand--light">
        <span>
          <WandSparkles size={17} />
        </span>{" "}
        Shareframe
      </div>
      <div className="d1-actions">
        <Button
          variant="outline"
          size="icon"
          aria-label="Undo (Ctrl+Z)"
          title="Undo (Ctrl+Z)"
          disabled={!canUndo}
          onClick={onUndo}
        >
          <Undo2 size={15} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Redo (Ctrl+Shift+Z)"
          title="Redo (Ctrl+Shift+Z)"
          disabled={!canRedo}
          onClick={onRedo}
        >
          <Redo2 size={15} />
        </Button>
        <Button variant="outline" onClick={onOpenUrlImport}>
          <Globe size={15} /> Import Website
        </Button>
        <Button variant="outline" onClick={onReset}>
          <RotateCcw size={15} /> Reset
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label={`Use ${theme === "dark" ? "light" : "dark"} theme`}
          onClick={onThemeToggle}
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </Button>
        {clipboardSupported && (
          <Button
            variant="outline"
            disabled={exporting}
            aria-label="Copy to clipboard (Ctrl+Shift+C)"
            title="Copy to clipboard (Ctrl+Shift+C)"
            onClick={onCopy}
          >
            <Clipboard size={15} /> Copy
          </Button>
        )}
        <DropdownMenu open={exportOpen} onOpenChange={onExportOpenChange}>
          <DropdownMenuTrigger
            disabled={exporting}
            render={<Button className="primary" disabled={exporting} />}
          >
            <ArrowDownToLine size={15} /> {exporting ? "Exporting…" : "Export image"}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="export-menu" align="end">
            {formats.map(({ id, description }) => (
              <DropdownMenuItem key={id} disabled={exporting} onClick={() => onExport(id)}>
                <b>{id.toUpperCase()}</b>
                <span>{description}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
