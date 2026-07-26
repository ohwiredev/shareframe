import type { TextStyle } from "../../state/types";
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
