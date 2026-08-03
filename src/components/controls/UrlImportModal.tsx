import { ArrowRight, Globe, Layers, Loader2, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { FEATURE_FLAGS } from "../../config/flags";
import { fetchWebsiteMetadata } from "../../lib/fetchMetadata";
import type { ExtractedMetadata } from "../../lib/websiteExtractor";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

type UrlImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onApplyToCanvas?: (extracted: ExtractedMetadata) => void;
  onOpenBatchMode: (extracted: ExtractedMetadata) => void;
};

export function UrlImportModal({
  isOpen,
  onClose,
  onApplyToCanvas,
  onOpenBatchMode,
}: UrlImportModalProps) {
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedMetadata | null>(null);

  if (!isOpen || !FEATURE_FLAGS.ENABLE_WEBSITE_IMPORT) return null;

  const handleFetch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!urlInput.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchWebsiteMetadata(urlInput);
      setExtracted(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch website metadata.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyBatch = () => {
    if (!extracted) return;
    onOpenBatchMode(extracted);
    onClose();
  };

  const handleApplySingle = () => {
    if (!extracted || !onApplyToCanvas) return;
    onApplyToCanvas(extracted);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-card text-card-foreground border border-border rounded-[20px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-[18px] font-sans leading-none text-foreground">
                Import Website Link
              </h3>
              <p className="text-[13px] text-muted-foreground mt-1 leading-[1.55]">
                Auto-generate OG images with title, description, and brand logo
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

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          <form onSubmit={handleFetch} className="space-y-3">
            <Label htmlFor="website-url" className="text-[12px] font-[650] text-foreground">
              Website
            </Label>
            <div className="flex gap-2">
              <Input
                id="website-url"
                type="text"
                placeholder="e.g. https://mywebsite.com"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 bg-background border-border text-foreground rounded-lg text-[12px]"
                disabled={loading}
              />
              <div className="d1-actions">
                <button type="submit" className="primary" disabled={loading || !urlInput.trim()}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-1.5" />
                  )}
                  {loading ? "Extracting..." : "Extract"}
                </button>
              </div>
            </div>
          </form>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {extracted && (
            <div className="pt-2 border-t border-border space-y-3">
              {extracted.isFallback && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-300 text-xs leading-relaxed">
                  ⚠️ Live website metadata could not be fetched due to CORS or network restrictions.
                  Generated placeholder metadata for <b>{extracted.domain}</b>.
                </div>
              )}
              <div className="p-4 rounded-[14px] border border-border bg-muted/30 hover:border-border transition-all shadow-md flex items-start gap-4">
                {extracted.logoUrl ? (
                  <div className="w-12 h-12 rounded-xl bg-white p-1.5 flex items-center justify-center border border-border shadow-sm shrink-0">
                    <img
                      src={extracted.logoUrl}
                      alt="Logo"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const parent = (e.target as HTMLElement).parentElement;
                        if (parent) parent.style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-base shrink-0">
                    {extracted.domain.slice(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-[14px] text-foreground leading-snug truncate">
                    {extracted.title || extracted.domain}
                  </h4>
                  <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2 mt-1">
                    {extracted.description || "No description available."}
                  </p>
                  {extracted.links && extracted.links.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      <span>
                        Discovered {extracted.links.length} pages on {extracted.domain}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {extracted && (
          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/40 d1-actions">
            {onApplyToCanvas && (
              <button type="button" onClick={handleApplySingle} className="w-full sm:w-auto">
                Apply to Active Canvas
              </button>
            )}
            <button type="button" onClick={handleApplyBatch} className="w-full sm:w-auto primary">
              <Layers className="w-4 h-4 mr-1.5" /> Batch Generate ({extracted.links.length}{" "}
              {extracted.links.length === 1 ? "Page" : "Pages"})
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
