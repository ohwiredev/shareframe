import type { CanvasElement, HorizontalAlignment, OverlayPosition } from "../state/types";

export type TemplateBackground =
  | {
      type: "solid";
      color: string;
    }
  | {
      type: "gradient";
      style?: "linear" | "radial";
      angle?: number;
      cx?: number;
      cy?: number;
      radius?: "farthest-corner" | number;
      colors: string[];
      stops?: number[];
    };

export type TemplateLogo = {
  y?: number;
  scale?: number;
  alignment?: HorizontalAlignment;
  src?: string | null;
};

export type TemplateTextStyle = {
  content?: string;
  fontFamily?: string;
  fontSize?: number;
  width?: number;
  fontWeight?: number;
  color?: string;
  alignment?: HorizontalAlignment;
  yOffset?: number;
};

export type TemplateImage = {
  enabled?: boolean;
  src?: string | null;
  position?: OverlayPosition;
  scale?: number;
  borderRadius?: number;
  shadow?: boolean;
  shadowBlur?: number;
  yOffset?: number;
};

export type TemplateBadge = {
  text?: string;
  color?: string;
  background?: string;
};

export type TemplatePrice = {
  text?: string;
  color?: string;
  fontSize?: number;
  yOffset?: number;
};

export type TemplateRating = {
  value?: number;
  color?: string;
  reviewCount?: string;
};

export type TemplateState = {
  background?: TemplateBackground;
  elements?: CanvasElement[];
  logo?: TemplateLogo;
  title?: TemplateTextStyle;
  description?: TemplateTextStyle;
  image?: TemplateImage;
  badge?: TemplateBadge;
  price?: TemplatePrice;
  originalPrice?: TemplatePrice;
  rating?: TemplateRating;
};

export type OgTemplate = {
  id: string;
  name: string;
  description: string;
  category?: string;
  badge?: string;
  state: TemplateState;
};
