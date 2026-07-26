import { memo } from "react";
import { LayoutPanel, VStack } from "@astryxdesign/core/Layout";
import { Section } from "@astryxdesign/core/Section";
import { Heading, Text } from "@astryxdesign/core/Text";
import { CONTROLS_PANEL_WIDTH } from "../state/constants";
import type { EditorState, LogoState, TextStyle } from "../state/types";
import { ControlsForm } from "./ControlsForm";

type ControlsPanelProps = {
  state: EditorState;
  onBackgroundChange: (backgroundColor: string) => void;
  onLogoChange: (logo: LogoState) => void;
  onTitleChange: (title: TextStyle) => void;
  onDescriptionChange: (description: TextStyle) => void;
  /** When true, render fields only (for dialogs). Default: side panel chrome. */
  embedded?: boolean;
};

/**
 * Compose inspector: background, logo, title, description.
 *
 * Responsive contract (with App layout):
 *   > 768px   docked LayoutPanel (360)
 *   ≤ 768px   same form inside a Dialog (embedded)
 */
export const ControlsPanel = memo(function ControlsPanel({
  state,
  onBackgroundChange,
  onLogoChange,
  onTitleChange,
  onDescriptionChange,
  embedded = false,
}: ControlsPanelProps) {
  const form = (
    <ControlsForm
      state={state}
      onBackgroundChange={onBackgroundChange}
      onLogoChange={onLogoChange}
      onTitleChange={onTitleChange}
      onDescriptionChange={onDescriptionChange}
    />
  );

  if (embedded) {
    return form;
  }

  return (
    <LayoutPanel
      width={CONTROLS_PANEL_WIDTH}
      hasDivider
      isScrollable
      padding={0}
      label="Editor controls"
      role="complementary"
      className="controls-panel"
    >
      <Section variant="transparent" padding={4} dividers={["bottom"]}>
        <VStack gap={1}>
          <Heading level={3}>Compose</Heading>
          <Text type="supporting" color="secondary">
            Shape the image while the canvas updates live.
          </Text>
        </VStack>
      </Section>
      {form}
    </LayoutPanel>
  );
});
