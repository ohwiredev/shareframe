import { Button } from "@astryxdesign/core/Button";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import type { ExportFormat } from "../canvas/exportCanvas";

export type { ExportFormat };

type ExportButtonsProps = {
  onExport: (format: ExportFormat) => void;
  /** Stack vertically (default) or sit in a horizontal toolbar. */
  orientation?: "vertical" | "horizontal";
  /** Stretch buttons to full width of the container. */
  fullWidth?: boolean;
};

export function ExportButtons({
  onExport,
  orientation = "vertical",
  fullWidth = true,
}: ExportButtonsProps) {
  const width = fullWidth ? "100%" : undefined;

  const buttons = (
    <>
      <Button
        label="Download PNG"
        variant="primary"
        size="md"
        width={width}
        tooltip="Download a lossless PNG"
        onClick={() => onExport("png")}
      />
      <Button
        label="Download JPG"
        variant="secondary"
        size="sm"
        width={width}
        tooltip="Download a compact JPG"
        onClick={() => onExport("jpg")}
      />
      <Button
        label="Download WebP"
        variant="secondary"
        size="sm"
        width={width}
        tooltip="Download an efficient WebP"
        onClick={() => onExport("webp")}
      />
    </>
  );

  if (orientation === "horizontal") {
    return (
      <HStack gap={2} vAlign="center" wrap="wrap">
        {buttons}
      </HStack>
    );
  }

  return <VStack gap={2}>{buttons}</VStack>;
}
