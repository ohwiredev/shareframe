import type { EditorState } from "../state/types";
import blogFeaturedJson from "./definitions/blog-featured.json";
import blogHeroCardJson from "./definitions/blog-hero-card.json";
import blogOgJson from "./definitions/blog-og.json";
import devReleaseJson from "./definitions/dev-release.json";
import docsGuideJson from "./definitions/docs-guide.json";
import ecommercePromoJson from "./definitions/ecommerce-promo.json";
import ecommerceShowcaseJson from "./definitions/ecommerce-showcase.json";
import editorialOpinionJson from "./definitions/editorial-opinion.json";
import minimalJson from "./definitions/minimal.json";
import mobileShowcaseJson from "./definitions/mobile-showcase.json";
import newsletterDigestJson from "./definitions/newsletter-digest.json";
import podcastEpisodeJson from "./definitions/podcast-episode.json";
import saasLaunchJson from "./definitions/saas-launch.json";
import type { OgTemplate, TemplateState } from "./types";

export * from "./types";

export const BUILTIN_TEMPLATES: OgTemplate[] = [
  blogHeroCardJson as OgTemplate,
  blogFeaturedJson as OgTemplate,
  mobileShowcaseJson as OgTemplate,
  ecommerceShowcaseJson as OgTemplate,
  ecommercePromoJson as OgTemplate,
  blogOgJson as OgTemplate,
  saasLaunchJson as OgTemplate,
  docsGuideJson as OgTemplate,
  newsletterDigestJson as OgTemplate,
  devReleaseJson as OgTemplate,
  podcastEpisodeJson as OgTemplate,
  editorialOpinionJson as OgTemplate,
  minimalJson as OgTemplate,
];

/**
 * Applies a template to the current editor state.
 * Merges typography, placement, and background while preserving
 * an existing uploaded logo image unless overridden.
 */
export function applyTemplate(currentState: EditorState, template: OgTemplate): EditorState {
  const ts: TemplateState = template.state;

  const background = ts.background ?? currentState.background;

  const logo = {
    ...currentState.logo,
    ...(ts.logo?.y !== undefined && { y: ts.logo.y }),
    ...(ts.logo?.scale !== undefined && { scale: ts.logo.scale }),
    ...(ts.logo?.alignment !== undefined && { alignment: ts.logo.alignment }),
    src:
      ts.logo?.src !== undefined
        ? ts.logo.src
        : currentState.logo.src?.startsWith("data:image/svg+xml")
          ? null
          : currentState.logo.src,
  };

  const title = {
    ...currentState.title,
    ...(ts.title?.content !== undefined && { content: ts.title.content }),
    ...(ts.title?.fontFamily !== undefined && {
      fontFamily: ts.title.fontFamily,
    }),
    ...(ts.title?.fontSize !== undefined && { fontSize: ts.title.fontSize }),
    ...(ts.title?.width !== undefined && { width: ts.title.width }),
    ...(ts.title?.fontWeight !== undefined && {
      fontWeight: ts.title.fontWeight,
    }),
    ...(ts.title?.color !== undefined && { color: ts.title.color }),
    ...(ts.title?.alignment !== undefined && { alignment: ts.title.alignment }),
    yOffset: ts.title?.yOffset ?? currentState.title.yOffset ?? 0,
  };

  const description = {
    ...currentState.description,
    ...(ts.description?.content !== undefined && {
      content: ts.description.content,
    }),
    ...(ts.description?.fontFamily !== undefined && {
      fontFamily: ts.description.fontFamily,
    }),
    ...(ts.description?.fontSize !== undefined && {
      fontSize: ts.description.fontSize,
    }),
    ...(ts.description?.width !== undefined && { width: ts.description.width }),
    ...(ts.description?.fontWeight !== undefined && {
      fontWeight: ts.description.fontWeight,
    }),
    ...(ts.description?.color !== undefined && { color: ts.description.color }),
    ...(ts.description?.alignment !== undefined && {
      alignment: ts.description.alignment,
    }),
    yOffset: ts.description?.yOffset ?? currentState.description.yOffset ?? 0,
  };

  const image = ts.image
    ? {
        enabled: true,
        src: ts.image.src !== undefined ? ts.image.src : currentState.image.src,
        position: ts.image.position ?? currentState.image.position,
        scale: ts.image.scale ?? currentState.image.scale,
        borderRadius: ts.image.borderRadius ?? currentState.image.borderRadius,
        shadow: ts.image.shadow ?? currentState.image.shadow,
        shadowBlur: ts.image.shadowBlur ?? currentState.image.shadowBlur ?? 32,
        yOffset: ts.image.yOffset ?? currentState.image.yOffset,
      }
    : {
        ...currentState.image,
        enabled: false,
        src: null,
      };

  // E-commerce fields: set from template or clear when switching to non-e-commerce template
  const badge = ts.badge?.text
    ? {
        text: ts.badge.text ?? "",
        color: ts.badge.color ?? "#ffffff",
        background: ts.badge.background ?? "#10b981",
      }
    : undefined;

  const price = ts.price?.text
    ? {
        text: ts.price.text ?? "",
        color: ts.price.color ?? "#10b981",
        fontSize: ts.price.fontSize ?? currentState.price?.fontSize ?? 36,
        yOffset: ts.price.yOffset ?? currentState.price?.yOffset ?? 0,
      }
    : undefined;

  const originalPrice = ts.originalPrice?.text
    ? {
        text: ts.originalPrice.text ?? "",
        color: ts.originalPrice.color ?? "#9ca3af",
        fontSize: ts.originalPrice.fontSize ?? currentState.originalPrice?.fontSize ?? 22,
        yOffset: ts.originalPrice.yOffset ?? currentState.originalPrice?.yOffset ?? 0,
      }
    : undefined;

  const rating =
    ts.rating?.value !== undefined && ts.rating.value > 0
      ? {
          value: ts.rating.value ?? 0,
          color: ts.rating.color ?? "#f59e0b",
          reviewCount: ts.rating.reviewCount ?? "",
        }
      : undefined;

  return {
    background,
    logo,
    title,
    description,
    image,
    badge,
    price,
    originalPrice,
    rating,
  };
}

/**
 * Parses and validates a template JSON string.
 */
export function parseTemplateJson(jsonString: string): OgTemplate {
  const data = JSON.parse(jsonString) as Partial<OgTemplate>;

  if (!data || typeof data !== "object") {
    throw new Error("Invalid JSON: Expected an object.");
  }
  if (!data.id || typeof data.id !== "string") {
    throw new Error("Invalid Template JSON: Missing or invalid 'id' field.");
  }
  if (!data.name || typeof data.name !== "string") {
    throw new Error("Invalid Template JSON: Missing or invalid 'name' field.");
  }
  if (!data.state || typeof data.state !== "object") {
    throw new Error("Invalid Template JSON: Missing or invalid 'state' object.");
  }

  const s = data.state;
  if (s.title && typeof s.title.fontSize === "number") {
    s.title.fontSize = Math.max(12, Math.min(200, s.title.fontSize));
  }
  if (s.description && typeof s.description.fontSize === "number") {
    s.description.fontSize = Math.max(10, Math.min(100, s.description.fontSize));
  }
  if (s.logo && typeof s.logo.scale === "number") {
    s.logo.scale = Math.max(0.2, Math.min(3, s.logo.scale));
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description ?? "Custom imported template",
    category: data.category ?? "Custom",
    badge: data.badge ?? "Custom",
    state: s,
  };
}

/**
 * Serializes the current EditorState into a standardized template JSON string.
 */
export function exportTemplateJson(
  state: EditorState,
  name: string = "Custom Template",
  description: string = "Exported from Shareframe",
): string {
  const template: OgTemplate = {
    id: `custom-${Date.now()}`,
    name,
    description,
    category: "Custom",
    badge: "Custom",
    state: {
      background: state.background,
      logo: {
        y: state.logo.y,
        scale: state.logo.scale,
        alignment: state.logo.alignment,
      },
      title: state.title,
      description: state.description,
      image: state.image,
      ...(state.badge && { badge: state.badge }),
      ...(state.price && { price: state.price }),
      ...(state.originalPrice && { originalPrice: state.originalPrice }),
      ...(state.rating && { rating: state.rating }),
    },
  };

  return JSON.stringify(template, null, 2);
}
