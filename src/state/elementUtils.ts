import type {
  Background,
  BadgeElement,
  BadgeState,
  CanvasElement,
  EditorState,
  ImageElement,
  LogoElement,
  LogoState,
  OverlayImageState,
  PriceElement,
  PriceState,
  RatingElement,
  RatingState,
  SafeAreaConfig,
  TextElement,
  TextElementRole,
  TextStyle,
} from "./types";

export function findTextElement(
  state: EditorState,
  role: TextElementRole,
): TextElement | undefined {
  if (!state.elements) return undefined;
  return state.elements.find((el): el is TextElement => el.type === "text" && el.role === role);
}

export function findLogoElement(state: EditorState): LogoElement | undefined {
  if (!state.elements) return undefined;
  return state.elements.find((el): el is LogoElement => el.type === "logo");
}

export function findImageElement(state: EditorState): ImageElement | undefined {
  if (!state.elements) return undefined;
  return state.elements.find((el): el is ImageElement => el.type === "image");
}

export function findBadgeElement(state: EditorState): BadgeElement | undefined {
  if (!state.elements) return undefined;
  return state.elements.find((el): el is BadgeElement => el.type === "badge");
}

export function findPriceElement(state: EditorState): PriceElement | undefined {
  if (!state.elements) return undefined;
  return state.elements.find((el): el is PriceElement => el.type === "price");
}

export function findRatingElement(state: EditorState): RatingElement | undefined {
  if (!state.elements) return undefined;
  return state.elements.find((el): el is RatingElement => el.type === "rating");
}

export function updateElement<T extends CanvasElement>(
  state: EditorState,
  id: string,
  patch: Partial<T>,
): EditorState {
  const elements = (state.elements || []).map((el) =>
    el.id === id ? ({ ...el, ...patch } as CanvasElement) : el,
  );
  return { ...state, elements };
}

export function setOrUpdateElement(state: EditorState, element: CanvasElement): EditorState {
  const elements = state.elements || [];
  const index = elements.findIndex((el) => el.id === element.id);

  if (index >= 0) {
    const updated = [...elements];
    updated[index] = element;
    return { ...state, elements: updated };
  }

  return { ...state, elements: [...elements, element] };
}

export function removeElement(state: EditorState, idOrType: string): EditorState {
  const elements = (state.elements || []).filter(
    (el) => el.id !== idOrType && el.type !== idOrType,
  );
  return { ...state, elements };
}

/**
 * Legacy compatibility converters to map between old flat fields and CanvasElement shapes.
 */
export function textStyleToTextElement(
  id: string,
  role: TextElementRole,
  style: TextStyle,
): TextElement {
  return {
    id,
    type: "text",
    role,
    content: style.content,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    color: style.color,
    alignment: style.alignment,
    width: style.width,
    yOffset: style.yOffset,
  };
}

export function textElementToTextStyle(el?: TextElement): TextStyle {
  return {
    content: el?.content ?? "",
    fontFamily: el?.fontFamily ?? "Inter",
    fontSize: el?.fontSize ?? 48,
    fontWeight: el?.fontWeight ?? 700,
    color: el?.color ?? "#ffffff",
    alignment: el?.alignment ?? "center",
    width: el?.width ?? 100,
    yOffset: el?.yOffset ?? 0,
  };
}

export function logoStateToLogoElement(logo: LogoState): LogoElement {
  return {
    id: "logo-main",
    type: "logo",
    src: logo.src,
    y: logo.y,
    scale: logo.scale,
    alignment: logo.alignment,
  };
}

export function logoElementToLogoState(el?: LogoElement): LogoState {
  return {
    src: el?.src ?? null,
    y: el?.y ?? 0.1,
    scale: el?.scale ?? 0.85,
    alignment: el?.alignment ?? "center",
  };
}

export function overlayStateToImageElement(image: OverlayImageState): ImageElement {
  return {
    id: "image-overlay",
    type: "image",
    role: "overlay",
    enabled: image.enabled,
    src: image.src,
    position: image.position,
    scale: image.scale,
    borderRadius: image.borderRadius,
    shadow: image.shadow,
    shadowBlur: image.shadowBlur,
    yOffset: image.yOffset,
  };
}

export function imageElementToOverlayState(el?: ImageElement): OverlayImageState {
  return {
    enabled: el?.enabled ?? false,
    src: el?.src ?? null,
    position: el?.position ?? "bottom",
    scale: el?.scale ?? 1,
    borderRadius: el?.borderRadius ?? 16,
    shadow: el?.shadow ?? false,
    shadowBlur: el?.shadowBlur ?? 32,
    yOffset: el?.yOffset ?? 0,
  };
}

export function badgeStateToBadgeElement(badge: BadgeState): BadgeElement {
  return {
    id: "badge-main",
    type: "badge",
    text: badge.text,
    color: badge.color,
    background: badge.background,
  };
}

export function priceStateToPriceElement(
  price: PriceState,
  originalPrice?: PriceState,
): PriceElement {
  return {
    id: "price-main",
    type: "price",
    text: price.text,
    color: price.color,
    fontSize: price.fontSize,
    yOffset: price.yOffset,
    originalPriceText: originalPrice?.text,
    originalPriceColor: originalPrice?.color,
    originalPriceFontSize: originalPrice?.fontSize,
  };
}

export function ratingStateToRatingElement(rating: RatingState): RatingElement {
  return {
    id: "rating-main",
    type: "rating",
    value: rating.value,
    color: rating.color,
    reviewCount: rating.reviewCount,
  };
}

/**
 * Converts any raw state (legacy or new) into a canonical EditorState with elements: [].
 */
export function normalizeState(rawState: unknown): EditorState {
  if (!rawState || typeof rawState !== "object") {
    return {
      background: { type: "solid", color: "#09090b" },
      elements: [],
    };
  }

  const raw = rawState as Record<string, unknown>;
  const templateId = raw.templateId as string | undefined;
  const background = (raw.background as Background | undefined) ?? {
    type: "solid",
    color: "#09090b",
  };
  const safeArea = raw.safeArea as SafeAreaConfig | undefined;

  if (Array.isArray(raw.elements) && raw.elements.length > 0) {
    return {
      templateId,
      background,
      safeArea,
      elements: raw.elements,
    };
  }

  // Construct elements array from legacy flat state
  const elements: CanvasElement[] = [];

  if (raw.logo) {
    elements.push(logoStateToLogoElement(raw.logo as LogoState));
  }

  if (raw.title) {
    elements.push(textStyleToTextElement("text-title", "title", raw.title as TextStyle));
  }

  if (raw.description) {
    elements.push(
      textStyleToTextElement("text-description", "description", raw.description as TextStyle),
    );
  }

  if ((raw.image as OverlayImageState | undefined)?.enabled) {
    elements.push(overlayStateToImageElement(raw.image as OverlayImageState));
  }

  if ((raw.badge as BadgeState | undefined)?.text) {
    elements.push(badgeStateToBadgeElement(raw.badge as BadgeState));
  }

  if ((raw.price as PriceState | undefined)?.text) {
    elements.push(
      priceStateToPriceElement(
        raw.price as PriceState,
        raw.originalPrice as PriceState | undefined,
      ),
    );
  }

  if (
    raw.rating &&
    ((raw.rating as RatingState).value > 0 || (raw.rating as RatingState).reviewCount)
  ) {
    elements.push(ratingStateToRatingElement(raw.rating as RatingState));
  }

  return {
    templateId,
    background,
    safeArea,
    elements,
  };
}
