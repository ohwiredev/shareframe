import { zipSync } from "fflate";
import { Check, Download, Layers, Loader2, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { RenderPipeline } from "../../canvas/renderPipeline";
import type {
  ExtractedLink,
  ExtractedMetadata,
} from "../../lib/websiteExtractor";
import { gradientToCss } from "../../state/gradient";
import type { EditorState } from "../../state/types";
import { applyTemplate, BUILTIN_TEMPLATES } from "../../templates";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";

type BatchOgGeneratorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  extracted: ExtractedMetadata | null;
  baseState: EditorState;
  pipeline: RenderPipeline | null;
  onSelectLinkForCanvas?: (state: EditorState) => void;
};

// Mini high-fidelity visual preview of the OG image for each page card
function BatchPagePreviewThumbnail({ state }: { state: EditorState }) {
  const bg = state.background;
  const bgStyle =
    bg?.type === "gradient" ? gradientToCss(bg) : (bg?.color ?? "#1e293b");

  const title = state.title;
  const desc = state.description;

  const align = title?.alignment || "center";
  const alignClass =
    align === "left"
      ? "items-start text-left"
      : align === "right"
        ? "items-end text-right"
        : "items-center text-center";

  const titleSize = Math.max(13, Math.min(18, (title?.fontSize || 64) * 0.25));
  const descSize = Math.max(9, Math.min(11, (desc?.fontSize || 26) * 0.25));

  const titleWidth = title?.width ?? 90;
  const descWidth = desc?.width ?? 85;

  const logo = state.logo;
  const hasLogo = Boolean(logo?.src);
  const image = state.image;
  const hasImage = Boolean(image?.src);
  const imagePos = image?.position || "bottom";

  const renderTextContent = () => (
    <div className={`w-full flex flex-col ${alignClass} gap-1`}>
      {hasLogo && logo?.src && (
        <img
          src={logo.src}
          alt=""
          className="max-h-[22px] w-auto object-contain mb-0.5 drop-shadow-sm"
        />
      )}
      {title?.content && (
        <h4
          className="line-clamp-2 leading-tight tracking-tight drop-shadow-sm font-semibold"
          style={{
            fontFamily: title.fontFamily || "Inter, sans-serif",
            fontSize: `${titleSize}px`,
            color: title.color || "#ffffff",
            maxWidth: `${titleWidth}%`,
          }}
        >
          {title.content}
        </h4>
      )}
      {desc?.content && (
        <p
          className="line-clamp-2 leading-normal opacity-85 drop-shadow-sm"
          style={{
            fontFamily: desc.fontFamily || "Inter, sans-serif",
            fontSize: `${descSize}px`,
            color: desc.color || "#c8c8d4",
            maxWidth: `${descWidth}%`,
          }}
        >
          {desc.content}
        </p>
      )}
    </div>
  );

  const renderImageElement = (maxH: string) => {
    if (!image?.src) return null;
    const scaledRadius = Math.max(4, (image.borderRadius || 16) * 0.25);
    return (
      <img
        src={image.src}
        alt=""
        className={`${maxH} w-auto max-w-full object-contain rounded border border-white/15 shadow-md`}
        style={{ borderRadius: `${scaledRadius}px` }}
      />
    );
  };

  return (
    <div
      className="w-full aspect-[1200/630] rounded-lg border border-[#ffffff18] overflow-hidden flex flex-col justify-center px-4 py-3 shadow-inner relative select-none"
      style={{ background: bgStyle }}
    >
      {!hasImage ? (
        renderTextContent()
      ) : imagePos === "right" ? (
        <div className="flex items-center justify-between w-full h-full gap-2">
          <div className="flex-1 min-w-0">{renderTextContent()}</div>
          <div className="w-[42%] shrink-0 flex items-center justify-end">
            {renderImageElement("max-h-[85px]")}
          </div>
        </div>
      ) : imagePos === "left" ? (
        <div className="flex items-center justify-between w-full h-full gap-2.5">
          <div className="w-[34%] shrink-0 flex items-center justify-start">
            {renderImageElement("max-h-[92px]")}
          </div>
          <div className="flex-1 min-w-0">{renderTextContent()}</div>
        </div>
      ) : (
        <div className={`w-full flex flex-col ${alignClass} gap-1.5`}>
          {renderTextContent()}
          <div className="w-full flex justify-center mt-1">
            {renderImageElement("max-h-[64px] max-w-[90%]")}
          </div>
        </div>
      )}
    </div>
  );
}

export function BatchOgGeneratorModal({
  isOpen,
  onClose,
  extracted,
  baseState,
  pipeline,
  onSelectLinkForCanvas,
}: BatchOgGeneratorModalProps) {
  const [links, setLinks] = useState<ExtractedLink[]>(
    () => extracted?.links || [],
  );
  const [selectedTemplate, setSelectedTemplate] =
    useState<string>("minimal-dark");
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    () => new Set(),
  );
  const [exporting, setExporting] = useState(false);
  const [exportingIndex, setExportingIndex] = useState<number | null>(null);
  const [completedIndices, setCompletedIndices] = useState<Set<number>>(
    () => new Set(),
  );
  const [exportProgress, setExportProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  // Sync links when extracted metadata changes
  useEffect(() => {
    if (extracted) {
      setLinks(extracted.links);
      setSelectedIndices(new Set(extracted.links.map((_, i) => i)));
      setCompletedIndices(new Set());
    }
  }, [extracted]);

  if (!isOpen || !extracted) return null;

  const handleUpdateLink = (
    index: number,
    field: "title" | "description" | "path",
    value: string,
  ) => {
    setLinks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemoveLink = (index: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== index));
    setSelectedIndices((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
  };

  const toggleSelectIndex = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const activeTmpl = BUILTIN_TEMPLATES.find((t) => t.id === selectedTemplate);

  const buildPageState = (link: ExtractedLink): EditorState => {
    let state = { ...baseState };
    const tmpl = BUILTIN_TEMPLATES.find((t) => t.id === selectedTemplate);
    if (tmpl) {
      state = applyTemplate(state, tmpl);
    }
    return {
      ...state,
      title: {
        ...state.title,
        content: link.title,
      },
      description: {
        ...state.description,
        content:
          link.description ||
          `Official page for ${link.title} on ${extracted.domain}`,
      },
    };
  };

  const exportSingleBlob = async (link: ExtractedLink) => {
    if (!pipeline) return;
    const pageState = buildPageState(link);
    const blob = await pipeline.export(pageState, "png");
    const slug =
      link.path === "/"
        ? "home"
        : link.path.replace(/^\//, "").replace(/[/\s]+/g, "-");
    const fileName = `og-${extracted.domain}-${slug}.png`;

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    await new Promise((r) => setTimeout(r, 400));
    URL.revokeObjectURL(url);
  };

  const handleExportSingle = async (link: ExtractedLink, index: number) => {
    if (!pipeline || exporting) return;
    setExporting(true);
    setExportingIndex(index);
    try {
      await exportSingleBlob(link);
      setCompletedIndices((prev) => new Set(prev).add(index));
    } catch (err) {
      console.error("Single export failed", err);
    } finally {
      setExporting(false);
      setExportingIndex(null);
    }
  };

  const handleExportSelected = async () => {
    if (!pipeline || selectedIndices.size === 0 || !extracted) return;
    const targetIndices = Array.from(selectedIndices).sort((a, b) => a - b);
    setExporting(true);
    setExportProgress({ current: 0, total: targetIndices.length });

    try {
      const files: Record<string, Uint8Array> = {};
      for (let i = 0; i < targetIndices.length; i++) {
        const linkIndex = targetIndices[i];
        const link = links[linkIndex];
        setExportProgress({ current: i + 1, total: targetIndices.length });
        setExportingIndex(linkIndex);

        const pageState = buildPageState(link);
        const blob = await pipeline.export(pageState, "png");
        const arrayBuffer = await blob.arrayBuffer();
        const slug =
          link.path === "/"
            ? "home"
            : link.path.replace(/^\//, "").replace(/[/\s]+/g, "-");
        const fileName = `og-${extracted.domain}-${slug}.png`;
        files[fileName] = new Uint8Array(arrayBuffer);

        setCompletedIndices((prev) => new Set(prev).add(linkIndex));
      }

      const zipped = zipSync(files);
      const zipBlob = new Blob([zipped], { type: "application/zip" });
      const url = URL.createObjectURL(zipBlob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `shareframe-og-batch-${extracted.domain}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Batch export failed", err);
    } finally {
      setExporting(false);
      setExportingIndex(null);
      setExportProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-card text-card-foreground border border-border rounded-[20px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/15 text-primary">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-[18px] font-sans leading-none text-foreground">
                Visual Batch Studio - {extracted.domain}
              </h3>
              <p className="text-[13px] text-muted-foreground mt-1 leading-[1.55]">
                Preview, customize, and export Open Graph images for your
                website pages
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Template Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-border bg-muted/20">
          {/* Custom Styled Template Style Dropdown */}
          <div className="flex items-center gap-2.5">
            <Label className="text-[12px] font-[650] text-muted-foreground whitespace-nowrap">
              Template Style:
            </Label>
            <Select
              value={selectedTemplate}
              onValueChange={(val) => {
                if (val) setSelectedTemplate(val);
              }}
            >
              <SelectTrigger className="h-[36px] min-w-[250px] max-w-[340px] rounded-xl border border-[#ffffff1c] bg-[#15151a] hover:border-[#ffffff2e] text-[#f4f4f6] text-[12px] font-medium px-3 transition-all focus:ring-2 focus:ring-[#695cff]/40 shadow-sm cursor-pointer">
                <SelectValue>
                  {activeTmpl ? (
                    <div className="flex items-center justify-between w-full pr-1.5 gap-2">
                      <span className="font-medium text-[#f4f4f6] truncate">
                        {activeTmpl.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#695cff]/20 text-[#a59efc] shrink-0">
                        {activeTmpl.category}
                      </span>
                    </div>
                  ) : (
                    "Select template..."
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#18181d] border border-[#ffffff20] text-[#e7e7e9] shadow-2xl rounded-xl max-h-[300px] z-[200] p-1.5">
                {BUILTIN_TEMPLATES.map((tmpl) => (
                  <SelectItem
                    key={tmpl.id}
                    value={tmpl.id}
                    className="text-[12px] py-2 px-2.5 rounded-lg focus:bg-[#695cff]/20 focus:text-white cursor-pointer transition-colors my-0.5"
                  >
                    <div className="flex items-center justify-between w-full gap-3 pr-2">
                      <span className="font-medium text-[#f4f4f6]">{tmpl.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#ffffff10] text-[#a59efc] shrink-0">
                        {tmpl.category}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Export Progress Banner */}
        {exportProgress && (
          <div className="px-6 py-2 bg-[#695cff]/15 border-b border-[#695cff]/30 flex items-center justify-between text-xs text-[#d5d2ff]">
            <span className="flex items-center gap-2 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Generating image {exportProgress.current} of{" "}
              {exportProgress.total}...
            </span>
            <span>
              {Math.round(
                (exportProgress.current / exportProgress.total) * 100,
              )}
              %
            </span>
          </div>
        )}

        {/* Page Link Cards Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          {links.map((link, idx) => {
            const isSelected = selectedIndices.has(idx);
            const isExporting = exportingIndex === idx;
            const isDone = completedIndices.has(idx);
            const pageState = buildPageState(link);

            return (
              <div
                key={`${link.path}-${idx}`}
                className={`p-4 rounded-[14px] border transition-all flex flex-col gap-3 shadow-sm ${
                  isSelected
                    ? "border-[#695cff]/60 bg-[#15151b] shadow-[#695cff]/5"
                    : "border-[#ffffff14] bg-[#141417] opacity-85 hover:opacity-100"
                }`}
              >
                {/* Card Header Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleSelectIndex(idx)}
                      title={isSelected ? "Deselect this page" : "Select this page"}
                      aria-label={`Select page ${link.path}`}
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-all duration-150 cursor-pointer shrink-0 ${
                        isSelected
                          ? "bg-primary text-white shadow-sm shadow-primary/30 scale-100"
                          : "bg-muted border border-border text-transparent hover:border-foreground/50 hover:scale-105"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSelectIndex(idx)}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted text-foreground truncate cursor-pointer hover:text-primary transition-colors text-left"
                    >
                      {link.path}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isExporting ? (
                      <span className="text-[10px] font-medium text-primary flex items-center gap-1 bg-primary/15 px-2 py-0.5 rounded-full">
                        <Loader2 className="w-3 h-3 animate-spin" /> Generating
                      </span>
                    ) : isDone ? (
                      <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3" /> Exported
                      </span>
                    ) : null}

                    <div className="flex items-center gap-1.5 d1-actions">
                      {onSelectLinkForCanvas && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectLinkForCanvas(pageState);
                            onClose();
                          }}
                          aria-label={`Edit ${link.path} in Studio`}
                          title="Edit in Studio"
                          disabled={exporting}
                          className="text-[11px] px-2.5 py-1 rounded-lg"
                        >
                          Edit in Studio
                        </button>
                      )}
                      <button
                        type="button"
                        data-size="icon"
                        aria-label={`Download single PNG for ${link.path}`}
                        className="hover:text-foreground"
                        title="Download single PNG"
                        onClick={() => handleExportSingle(link, idx)}
                        disabled={exporting}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        data-size="icon"
                        aria-label={`Remove page ${link.path}`}
                        className="hover:text-destructive"
                        title="Remove page"
                        onClick={() => handleRemoveLink(idx)}
                        disabled={exporting}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Visual OG Image Thumbnail (1200x630 Aspect Ratio) */}
                <div className="w-full">
                  <BatchPagePreviewThumbnail state={pageState} />
                </div>

                {/* Editable Inputs */}
                <div className="space-y-2 pt-1">
                  <Input
                    value={link.title}
                    placeholder="Page title"
                    onChange={(e) =>
                      handleUpdateLink(idx, "title", e.target.value)
                    }
                    className="text-[12px] font-medium bg-background border-border text-foreground rounded-lg"
                  />
                  <Textarea
                    value={link.description || ""}
                    placeholder="Page description"
                    onChange={(e) =>
                      handleUpdateLink(idx, "description", e.target.value)
                    }
                    rows={2}
                    className="text-[12px] text-muted-foreground bg-background border-border rounded-lg"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/40 d1-actions">
          <div className="text-xs text-muted-foreground">
            Tip: Customize titles and descriptions for each page before
            exporting.
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} disabled={exporting}>
              Cancel
            </button>

            <button
              type="button"
              onClick={handleExportSelected}
              disabled={exporting || selectedIndices.size === 0 || !pipeline}
              className="primary"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting {exportProgress?.current || 0}/
                  {exportProgress?.total || 0}...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export Selected ({selectedIndices.size}) (.ZIP)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
