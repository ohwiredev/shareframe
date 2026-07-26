import {
  ArrowDownToLine,
  Moon,
  RotateCcw,
  Sun,
  WandSparkles,
} from "lucide-react";
import type { ExportFormat } from "../canvas/exportCanvas";
import type { ThemeMode } from "../App";
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
  onReset: () => void;
  onThemeToggle: () => void;
  onExportOpenChange: (open: boolean) => void;
  onExport: (format: ExportFormat) => void;
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
  onReset,
  onThemeToggle,
  onExportOpenChange,
  onExport,
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
        <DropdownMenu
          open={exportOpen}
          onOpenChange={onExportOpenChange}
        >
          <DropdownMenuTrigger
            disabled={exporting}
            render={<Button className="primary" disabled={exporting} />}
          >
            <ArrowDownToLine size={15} />{" "}
            {exporting ? "Exporting…" : "Export image"}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="export-menu" align="end">
            {formats.map(({ id, description }) => (
              <DropdownMenuItem
                key={id}
                disabled={exporting}
                onClick={() => onExport(id)}
              >
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
