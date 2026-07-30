import { Frame, Image as ImageIcon, LayoutTemplate, Palette, Type } from "lucide-react";
import { Button } from "./ui/button";

export type EditorPanel = "templates" | "canvas" | "logo" | "text" | "image";

type EditorNavigationProps = {
  activePanel: EditorPanel;
  showImagePanel: boolean;
  onPanelChange: (panel: EditorPanel) => void;
};

const panels = [
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "text", label: "Text", icon: Type },
  { id: "canvas", label: "Canvas", icon: Palette },
  { id: "logo", label: "Logo", icon: ImageIcon },
  { id: "image", label: "Image", icon: Frame },
] as const;

export function EditorNavigation({
  activePanel,
  showImagePanel,
  onPanelChange,
}: EditorNavigationProps) {
  const visiblePanels = panels.filter((p) => p.id !== "image" || showImagePanel);

  return (
    <aside className="d1-tools" aria-label="Editor sections">
      {visiblePanels.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          variant="ghost"
          className={activePanel === id ? "tool-active" : ""}
          onClick={() => onPanelChange(id)}
        >
          <Icon size={19} />
          <span>{label}</span>
        </Button>
      ))}
    </aside>
  );
}
