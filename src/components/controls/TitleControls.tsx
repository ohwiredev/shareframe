import { memo } from "react";
import { VStack } from "@astryxdesign/core/Layout";
import { TextInput } from "@astryxdesign/core/TextInput";
import type { TextStyle } from "../../state/types";
import { ControlSection } from "../ControlSection";
import { TextStyleFields } from "./TextStyleFields";

type TitleControlsProps = {
  title: TextStyle;
  onChange: (next: TextStyle) => void;
};

/** Title content + independent font, size, weight, and color. */
export const TitleControls = memo(function TitleControls({
  title,
  onChange,
}: TitleControlsProps) {
  return (
    <ControlSection
      title="Title"
      description="Heading text with its own type style."
    >
      <VStack gap={3}>
        <TextInput
          label="Title text"
          value={title.content}
          onChange={(content) => onChange({ ...title, content })}
          placeholder="Your title here"
          size="sm"
        />
        <TextStyleFields
          style={title}
          onChange={onChange}
          sizeMin={24}
          sizeMax={120}
          colorLabel="Title"
        />
      </VStack>
    </ControlSection>
  );
});
