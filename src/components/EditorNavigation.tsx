import { Image, Palette, Type } from "lucide-react";
import { Button } from "./ui/button";

export type EditorPanel = "canvas" | "logo" | "text";

type EditorNavigationProps = {
  activePanel: EditorPanel;
  onPanelChange: (panel: EditorPanel) => void;
};

const panels = [
  { id: "canvas", label: "Canvas", icon: Palette },
  { id: "logo", label: "Logo", icon: Image },
  { id: "text", label: "Text", icon: Type },
] as const;

export function EditorNavigation({
  activePanel,
  onPanelChange,
}: EditorNavigationProps) {
  return (
    <aside className="d1-tools" aria-label="Editor sections">
      {panels.map(({ id, label, icon: Icon }) => (
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
