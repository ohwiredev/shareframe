import { BackgroundControls } from "./controls/BackgroundControls";
import { DescriptionControls } from "./controls/DescriptionControls";
import { LogoControls } from "./controls/LogoControls";
import { TitleControls } from "./controls/TitleControls";
import type { EditorState, LogoState, TextStyle } from "../state/types";

export type ControlsFormProps = {
  state: EditorState;
  onBackgroundChange: (backgroundColor: string) => void;
  onLogoChange: (logo: LogoState) => void;
  onTitleChange: (title: TextStyle) => void;
  onDescriptionChange: (description: TextStyle) => void;
};

/** Shared compose fields used by the side panel and mobile dialog. */
export function ControlsForm({
  state,
  onBackgroundChange,
  onLogoChange,
  onTitleChange,
  onDescriptionChange,
}: ControlsFormProps) {
  return (
    <>
      <BackgroundControls
        backgroundColor={state.backgroundColor}
        onChange={onBackgroundChange}
      />
      <LogoControls logo={state.logo} onChange={onLogoChange} />
      <TitleControls title={state.title} onChange={onTitleChange} />
      <DescriptionControls
        description={state.description}
        onChange={onDescriptionChange}
      />
    </>
  );
}
