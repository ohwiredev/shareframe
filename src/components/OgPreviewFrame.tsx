import { AspectRatio } from "@astryxdesign/core/AspectRatio";
import { Card } from "@astryxdesign/core/Card";
import type { ReactNode } from "react";
import { OG_RATIO } from "../state/constants";

type OgPreviewFrameProps = {
  children: ReactNode;
};

/**
 * Aspect-ratio frame for the 1200×630 preview.
 * CSS scales the canvas for layout; export always uses full resolution.
 */
export function OgPreviewFrame({ children }: OgPreviewFrameProps) {
  return (
    <Card padding={0} width="100%" variant="muted" className="preview-frame">
      <AspectRatio ratio={OG_RATIO}>{children}</AspectRatio>
    </Card>
  );
}
