import {
  findImageElement,
  findLogoElement,
  findTextElement,
  normalizeState,
} from "../../state/elementUtils";
import { gradientToCss } from "../../state/gradient";
import type { EditorState } from "../../state/types";

/** Lightweight CSS mock of a 1200×630 OG frame for batch / variant grids. */
export function OgPreviewThumbnail({ state: rawState }: { state: EditorState }) {
  const state = normalizeState(rawState);
  const bg = state.background;
  const bgStyle = bg?.type === "gradient" ? gradientToCss(bg) : (bg?.color ?? "#1e293b");

  const title = findTextElement(state, "title");
  const desc = findTextElement(state, "description");

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

  const logo = findLogoElement(state);
  const hasLogo = Boolean(logo?.src);
  const image = findImageElement(state);
  const hasImage = Boolean(image?.enabled !== false && image?.src);
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
