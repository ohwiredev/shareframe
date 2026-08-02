import type { TextStyle } from "../../state/types";
import { PanelHeader } from "./PanelHeader";
import { TextEditor } from "./TextEditor";

type TextPanelProps = {
  title: TextStyle;
  description: TextStyle;
  onTitleChange: (title: TextStyle) => void;
  onDescriptionChange: (description: TextStyle) => void;
};

export function TextPanel({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}: TextPanelProps) {
  return (
    <>
      <PanelHeader
        title="Text"
        subtitle="Edit title and description with independent type controls."
      />
      <TextEditor label="Title" style={title} onChange={onTitleChange} />
      <TextEditor
        label="Description"
        style={description}
        multiline
        onChange={onDescriptionChange}
      />
    </>
  );
}
