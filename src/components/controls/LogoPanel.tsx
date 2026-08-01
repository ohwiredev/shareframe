import { Upload, X } from "lucide-react";
import { type DragEvent, type RefObject, useCallback, useState } from "react";
import type { LogoState } from "../../state/types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { AlignmentField } from "./AlignmentField";
import { RangeField } from "./RangeField";

type LogoPanelProps = {
  logo: LogoState;
  fileName: string;
  fileRef: RefObject<HTMLInputElement | null>;
  onFileChange: (file?: File) => void;
  onLogoChange: (logo: LogoState) => void;
  onRemove: () => void;
};

export function LogoPanel({
  logo,
  fileName,
  fileRef,
  onFileChange,
  onLogoChange,
  onRemove,
}: LogoPanelProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setDragActive(false);

      const file = event.dataTransfer?.files?.[0];
      if (file) {
        onFileChange(file);
      }
    },
    [onFileChange],
  );

  return (
    <>
      <Input
        ref={fileRef}
        hidden
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={(event) => onFileChange(event.currentTarget.files?.[0])}
      />
      <Button
        variant="outline"
        className={`upload-zone studio-upload ${dragActive ? "drag-active" : ""}`}
        onClick={() => fileRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload size={20} />
        <b>{dragActive ? "Drop image here" : fileName || "Choose your logo"}</b>
        <small>PNG, JPG, WebP or SVG · max 5 MB · or drag & drop</small>
      </Button>
      {logo.src && (
        <Button variant="destructive" className="remove-logo" onClick={onRemove}>
          <X size={14} /> Remove logo
        </Button>
      )}
      <Separator className="section-rule" />
      <AlignmentField
        value={logo.alignment}
        disabled={!logo.src}
        onChange={(alignment) => onLogoChange({ ...logo, alignment })}
      />
      <RangeField
        label="Vertical position"
        value={logo.y}
        min={0}
        max={1}
        step={0.01}
        disabled={!logo.src}
        display={`${Math.round(logo.y * 100)}%`}
        onChange={(y) => onLogoChange({ ...logo, y })}
      />
      <RangeField
        label="Logo scale"
        value={logo.scale}
        min={0.25}
        max={3}
        step={0.05}
        disabled={!logo.src}
        display={`${Math.round(logo.scale * 100)}%`}
        onChange={(scale) => onLogoChange({ ...logo, scale })}
      />
    </>
  );
}
