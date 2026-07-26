import { memo } from "react";
import { VStack } from "@astryxdesign/core/Layout";
import { TextArea } from "@astryxdesign/core/TextArea";
import type { TextStyle } from "../../state/types";
import { ControlSection } from "../ControlSection";
import { TextStyleFields } from "./TextStyleFields";

type DescriptionControlsProps = {
  description: TextStyle;
  onChange: (next: TextStyle) => void;
};

/** Description content + independent font, size, weight, and color. */
export const DescriptionControls = memo(function DescriptionControls({
  description,
  onChange,
}: DescriptionControlsProps) {
  return (
    <ControlSection
      title="Description"
      description="Supporting text with its own type style."
    >
      <VStack gap={3}>
        <TextArea
          label="Description text"
          value={description.content}
          onChange={(content) => onChange({ ...description, content })}
          placeholder="A short description for social previews."
          rows={3}
          size="sm"
        />
        <TextStyleFields
          style={description}
          onChange={onChange}
          sizeMin={14}
          sizeMax={64}
          colorLabel="Description"
        />
      </VStack>
    </ControlSection>
  );
});
