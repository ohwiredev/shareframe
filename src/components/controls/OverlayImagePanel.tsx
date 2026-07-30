import { Upload, X } from "lucide-react";
import type { RefObject } from "react";
import type { OverlayImageState } from "../../state/types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { RangeField } from "./RangeField";

type OverlayImagePanelProps = {
  image: OverlayImageState;
  fileName: string;
  fileRef: RefObject<HTMLInputElement | null>;
  onFileChange: (file?: File) => void;
  onImageChange: (image: OverlayImageState) => void;
  onRemove: () => void;
};

export function OverlayImagePanel({
  image,
  fileName,
  fileRef,
  onFileChange,
  onImageChange,
  onRemove,
}: OverlayImagePanelProps) {
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
        className="upload-zone studio-upload"
        onClick={() => fileRef.current?.click()}
      >
        <Upload size={20} />
        <b>{fileName || "Upload screenshot / card"}</b>
        <small>PNG, JPG, WebP or SVG · max 5 MB</small>
      </Button>
      {image.src && (
        <Button variant="destructive" className="remove-logo" onClick={onRemove}>
          <X size={14} /> Remove image
        </Button>
      )}

      <Separator className="section-rule" />

      <RangeField
        label="Card scale"
        value={image.scale}
        min={0.4}
        max={1.2}
        step={0.05}
        disabled={!image.src}
        display={`${Math.round(image.scale * 100)}%`}
        onChange={(scale) => onImageChange({ ...image, scale })}
      />

      <RangeField
        label="Corner radius"
        value={image.borderRadius}
        min={0}
        max={48}
        step={2}
        disabled={!image.src}
        display={`${image.borderRadius}px`}
        onChange={(borderRadius) => onImageChange({ ...image, borderRadius })}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "12px",
        }}
      >
        <Label style={{ margin: 0 }}>Elevation shadow</Label>
        <Button
          variant={image.shadow ? "default" : "outline"}
          size="sm"
          disabled={!image.src}
          onClick={() => onImageChange({ ...image, shadow: !image.shadow })}
        >
          {image.shadow ? "On" : "Off"}
        </Button>
      </div>
    </>
  );
}
