import { memo } from "react";
import { Center } from "@astryxdesign/core/Center";
import { HStack, LayoutContent, VStack } from "@astryxdesign/core/Layout";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { OG_HEIGHT, OG_WIDTH } from "../state/constants";
import type { EditorState } from "../state/types";
import { OgCanvas } from "./OgCanvas";
import { OgPreviewFrame } from "./OgPreviewFrame";

type PreviewPaneProps = {
  state: EditorState;
  /** Compact padding on narrow viewports. */
  compact?: boolean;
  /** Mobile / tablet actions under the canvas. */
  showMobileActions?: boolean;
  onOpenEdit?: () => void;
  onOpenExport?: () => void;
};

export const PreviewPane = memo(function PreviewPane({
  state,
  compact = false,
  showMobileActions = false,
  onOpenEdit,
  onOpenExport,
}: PreviewPaneProps) {
  return (
    <LayoutContent
      padding={compact ? 3 : 6}
      label="OG image preview"
      className="preview-workspace"
    >
      <Center height="100%" width="100%">
        <VStack
          gap={compact ? 3 : 4}
          hAlign="center"
          width="100%"
          maxWidth={compact ? 720 : 840}
        >
          <HStack
            gap={2}
            vAlign="center"
            hAlign="between"
            width="100%"
            className="canvas-header"
          >
            <Heading level={4}>Preview</Heading>
            <Text type="supporting" color="secondary">
              {OG_WIDTH} × {OG_HEIGHT} · Live
            </Text>
          </HStack>
          <OgPreviewFrame>
            <OgCanvas state={state} />
          </OgPreviewFrame>
          {showMobileActions ? (
            <HStack gap={2} width="100%" className="mobile-action-bar">
              <Button
                label="Edit image"
                variant="secondary"
                size="md"
                width="100%"
                onClick={onOpenEdit}
              />
              <Button
                label="Export"
                variant="primary"
                size="md"
                width="100%"
                onClick={onOpenExport}
              />
            </HStack>
          ) : null}
        </VStack>
      </Center>
    </LayoutContent>
  );
});
