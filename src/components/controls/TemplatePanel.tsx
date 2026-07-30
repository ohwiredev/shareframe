import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { ensureEditorFontsLoaded } from "../../fonts/loadGoogleFont";
import type { EditorState } from "../../state/types";
import { BUILTIN_TEMPLATES, type OgTemplate } from "../../templates";
import { Label } from "../ui/label";

type TemplatePanelProps = {
  currentState: EditorState;
  onApplyTemplate: (template: OgTemplate) => void;
};

function TemplatePreviewThumbnail({ template }: { template: OgTemplate }) {
  const bg = template.state.background;
  const bgStyle =
    bg?.type === "gradient"
      ? `linear-gradient(${bg.angle}deg, ${bg.colors.join(", ")})`
      : (bg?.color ?? "#1e293b");

  const title = template.state.title;
  const desc = template.state.description;

  const align = title?.alignment || "center";
  const alignClass =
    align === "left"
      ? "items-start text-left"
      : align === "right"
        ? "items-end text-right"
        : "items-center text-center";

  // Proportional font sizing for the mini 1200x630 preview card (~0.22 scale ratio)
  const titleSize = Math.max(12, Math.min(15, (title?.fontSize || 64) * 0.22));
  const descSize = Math.max(8, Math.min(10, (desc?.fontSize || 26) * 0.22));

  const titleWidth = title?.width ?? 90;
  const descWidth = desc?.width ?? 85;

  const logo = template.state.logo;
  const hasLogo = Boolean(logo?.src);
  const image = template.state.image;
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
          className="line-clamp-2 leading-tight tracking-tight drop-shadow-sm"
          style={{
            fontFamily: title.fontFamily || "Inter, sans-serif",
            fontSize: `${titleSize}px`,
            fontWeight: title.fontWeight || 700,
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
            fontWeight: desc.fontWeight || 400,
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
    const scaledRadius = Math.max(4, (image.borderRadius || 16) * 0.22);
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
    <div className="studio-template-preview" style={{ background: bgStyle }}>
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

export function TemplatePanel({ currentState, onApplyTemplate }: TemplatePanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [, setFontsLoaded] = useState(false);

  useEffect(() => {
    const stacks = BUILTIN_TEMPLATES.flatMap((t) => [
      t.state.title?.fontFamily,
      t.state.description?.fontFamily,
    ]).filter((s): s is string => Boolean(s));
    void ensureEditorFontsLoaded(stacks).then(() => {
      setFontsLoaded(true);
    });
  }, []);

  const categories = [
    "All",
    ...Array.from(new Set(BUILTIN_TEMPLATES.map((t) => t.category || "General"))),
  ];

  const filteredTemplates = BUILTIN_TEMPLATES.filter((t) => {
    if (selectedCategory === "All") return true;
    return (t.category || "General") === selectedCategory;
  });

  const isSelected = (template: OgTemplate) => {
    const bg = template.state.background;
    if (!bg) return false;
    if (bg.type !== currentState.background.type) return false;
    if (bg.type === "solid" && currentState.background.type === "solid") {
      return bg.color.toLowerCase() === currentState.background.color.toLowerCase();
    }
    if (bg.type === "gradient" && currentState.background.type === "gradient") {
      return (
        bg.colors.length === currentState.background.colors.length &&
        bg.colors.every(
          (c, i) =>
            c.toLowerCase() ===
            (currentState.background as { type: "gradient"; colors: string[] }).colors[
              i
            ].toLowerCase(),
        )
      );
    }
    return false;
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <Label className="text-xs!">Templates</Label>
        <span className="text-xs text-white/50">{BUILTIN_TEMPLATES.length} available</span>
      </div>

      <div className="flex flex-wrap gap-1.5 my-2">
        {categories.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`text-sm! px-2.5 py-0.5 rounded-full font-medium inline-flex items-center justify-center transition-colors cursor-pointer ${
                active
                  ? "bg-[#887bff] text-white shadow-sm"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <div className="studio-template-cards">
        {filteredTemplates.map((template) => {
          const selected = isSelected(template);
          return (
            <button
              type="button"
              key={template.id}
              onClick={() => onApplyTemplate(template)}
              className={`studio-template-card ${selected ? "selected" : ""}`}
            >
              <div className="studio-template-card-header">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="studio-template-card-title truncate">{template.name}</span>
                  {template.badge && (
                    <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                      {template.badge}
                    </span>
                  )}
                </div>
                {selected && (
                  <span className="text-[#887bff] flex items-center justify-center shrink-0 ml-1">
                    <Check size={15} />
                  </span>
                )}
              </div>
              <TemplatePreviewThumbnail template={template} />
            </button>
          );
        })}
      </div>
    </>
  );
}
