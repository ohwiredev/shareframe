import type { HorizontalAlignment, OverlayPosition } from "../state/types";

export type TemplateBackground =
  | {
      type: "solid";
      color: string;
    }
  | {
      type: "gradient";
      angle: number;
      colors: string[];
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

export type TemplateState = {
  background?: TemplateBackground;
  logo?: TemplateLogo;
  title?: TemplateTextStyle;
  description?: TemplateTextStyle;
  image?: TemplateImage;
};

export type OgTemplate = {
  id: string;
  name: string;
  description: string;
  category?: string;
  badge?: string;
  state: TemplateState;
};
