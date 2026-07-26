import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import type { ExportFormat } from "../canvas/exportCanvas";
import { ExportPanel } from "./ExportPanel";

type ExportDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (format: ExportFormat) => void;
};

/** Export chooser when the side export panel is hidden. */
export function ExportDialog({
  isOpen,
  onOpenChange,
  onExport,
}: ExportDialogProps) {
  const handleExport = (format: ExportFormat) => {
    onExport(format);
    onOpenChange(false);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      purpose="info"
      width={360}
      maxHeight="85vh"
      padding={0}
    >
      <Layout
        height="auto"
        header={
          <DialogHeader
            title="Export"
            subtitle="Download full-resolution image"
            onOpenChange={onOpenChange}
          />
        }
        content={
          <LayoutContent padding={0} isScrollable={false} label="Export options">
            <ExportPanel embedded onExport={handleExport} />
          </LayoutContent>
        }
      />
    </Dialog>
  );
}
