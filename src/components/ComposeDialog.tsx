import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import type { EditorState, LogoState, TextStyle } from "../state/types";
import { ControlsPanel } from "./ControlsPanel";

type ComposeDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  state: EditorState;
  onBackgroundChange: (backgroundColor: string) => void;
  onLogoChange: (logo: LogoState) => void;
  onTitleChange: (title: TextStyle) => void;
  onDescriptionChange: (description: TextStyle) => void;
};

/** Full-height compose sheet for mobile / narrow layouts. */
export function ComposeDialog({
  isOpen,
  onOpenChange,
  state,
  onBackgroundChange,
  onLogoChange,
  onTitleChange,
  onDescriptionChange,
}: ComposeDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      purpose="form"
      width={420}
      maxHeight="90vh"
      padding={0}
    >
      <Layout
        height="fill"
        header={
          <DialogHeader
            title="Compose"
            subtitle="Changes update the live preview"
            onOpenChange={onOpenChange}
          />
        }
        content={
          <LayoutContent padding={0} isScrollable label="Compose controls">
            <ControlsPanel
              embedded
              state={state}
              onBackgroundChange={onBackgroundChange}
              onLogoChange={onLogoChange}
              onTitleChange={onTitleChange}
              onDescriptionChange={onDescriptionChange}
            />
          </LayoutContent>
        }
      />
    </Dialog>
  );
}
