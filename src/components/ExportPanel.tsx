import { memo } from "react";
import { Card } from "@astryxdesign/core/Card";
import { LayoutPanel, VStack } from "@astryxdesign/core/Layout";
import { Section } from "@astryxdesign/core/Section";
import { Heading, Text } from "@astryxdesign/core/Text";
import type { ExportFormat } from "../canvas/exportCanvas";
import { EXPORT_PANEL_WIDTH, OG_HEIGHT, OG_WIDTH } from "../state/constants";
import { ExportButtons } from "./ExportButtons";

type ExportPanelProps = {
  onExport: (format: ExportFormat) => void;
  /** When true, render body only (for dialogs). */
  embedded?: boolean;
};

export const ExportPanel = memo(function ExportPanel({
  onExport,
  embedded = false,
}: ExportPanelProps) {
  const body = (
    <Section variant="transparent" padding={4}>
      <VStack gap={4}>
        <Card variant="muted" padding={4}>
          <VStack gap={2}>
            <Text type="supporting" color="accent" weight="medium">
              OPEN GRAPH
            </Text>
            <Heading level={4}>Ready at full size</Heading>
            <Text type="supporting" color="secondary">
              {OG_WIDTH} × {OG_HEIGHT} pixels
            </Text>
          </VStack>
        </Card>
        <VStack gap={2}>
          <Text type="label" weight="medium">
            Download format
          </Text>
          <ExportButtons onExport={onExport} fullWidth />
        </VStack>
        <Text type="supporting" color="secondary">
          PNG is best for crisp text. JPG is compact. WebP balances both.
        </Text>
      </VStack>
    </Section>
  );

  if (embedded) {
    return body;
  }

  return (
    <LayoutPanel
      width={EXPORT_PANEL_WIDTH}
      hasDivider
      isScrollable
      padding={0}
      label="Export options"
      role="complementary"
      className="export-panel"
    >
      <Section variant="transparent" padding={4} dividers={["bottom"]}>
        <VStack gap={1}>
          <Heading level={3}>Export</Heading>
          <Text type="supporting" color="secondary">
            Download the image you see.
          </Text>
        </VStack>
      </Section>
      {body}
    </LayoutPanel>
  );
});
