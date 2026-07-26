import { memo, useEffect, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { FileInput } from "@astryxdesign/core/FileInput";
import { VStack } from "@astryxdesign/core/Layout";
import { Slider } from "@astryxdesign/core/Slider";
import type { LogoState } from "../../state/types";
import { ControlSection } from "../ControlSection";

/** Max upload size — generous for logos; keeps memory reasonable. */
const MAX_LOGO_BYTES = 5 * 1024 * 1024;

type LogoControlsProps = {
  logo: LogoState;
  onChange: (next: LogoState) => void;
};

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatScale(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/**
 * Logo file upload + position (x/y fractions) + scale.
 * Object URL lifecycle is owned by App (revoke on replace / remove / reset).
 */
export const LogoControls = memo(function LogoControls({
  logo,
  onChange,
}: LogoControlsProps) {
  const [file, setFile] = useState<File | null>(null);

  // Clear local file when parent drops the logo (e.g. Start over).
  useEffect(() => {
    if (!logo.src) {
      setFile(null);
    }
  }, [logo.src]);

  const hasLogo = Boolean(logo.src);
  const patch = (partial: Partial<LogoState>) => {
    onChange({ ...logo, ...partial });
  };

  const onFileChange = (next: File | File[] | null) => {
    const selected = Array.isArray(next) ? (next[0] ?? null) : next;
    setFile(selected);

    if (!selected) {
      onChange({ ...logo, src: null });
      return;
    }

    const src = URL.createObjectURL(selected);
    onChange({ ...logo, src });
  };

  const onRemove = () => {
    setFile(null);
    onChange({ ...logo, src: null });
  };

  return (
    <ControlSection
      title="Logo"
      description="Upload a logo (PNG preferred), then place and scale it."
    >
      <VStack gap={3}>
        <FileInput
          label="Logo file"
          value={file}
          onChange={onFileChange}
          accept="image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg"
          maxSize={MAX_LOGO_BYTES}
          mode="dropzone"
          placeholder="Drop logo or choose file"
          description="PNG, JPG, WebP, or SVG · max 5 MB"
          isOptional
        />

        {hasLogo ? (
          <Button
            label="Remove logo"
            variant="ghost"
            size="sm"
            onClick={onRemove}
          />
        ) : null}

        <Slider
          label="Horizontal position"
          value={logo.x}
          min={0}
          max={1}
          step={0.01}
          onChange={(x: number) => patch({ x: clamp01(x) })}
          formatValue={formatPercent}
          valueDisplay="text"
          isDisabled={!hasLogo}
          disabledMessage="Upload a logo to adjust position"
        />

        <Slider
          label="Vertical position"
          value={logo.y}
          min={0}
          max={1}
          step={0.01}
          onChange={(y: number) => patch({ y: clamp01(y) })}
          formatValue={formatPercent}
          valueDisplay="text"
          isDisabled={!hasLogo}
          disabledMessage="Upload a logo to adjust position"
        />

        <Slider
          label="Scale"
          value={logo.scale}
          min={0.25}
          max={3}
          step={0.05}
          onChange={(scale: number) =>
            patch({ scale: Math.min(3, Math.max(0.25, scale)) })
          }
          formatValue={formatScale}
          valueDisplay="text"
          isDisabled={!hasLogo}
          disabledMessage="Upload a logo to adjust scale"
          description="1 = default size on the OG canvas"
        />
      </VStack>
    </ControlSection>
  );
});
