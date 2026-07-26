import { NumberInput } from "@astryxdesign/core/NumberInput";
import { VStack } from "@astryxdesign/core/Layout";
import { Selector } from "@astryxdesign/core/Selector";
import { ensureFontLoaded } from "../../fonts/loadGoogleFont";
import {
  FONT_SELECTOR_OPTIONS,
  FONT_WEIGHT_SELECTOR_OPTIONS,
  isKnownFontStack,
  weightToOptionValue,
} from "../../state/fonts";
import type { TextStyle } from "../../state/types";
import { HexColorField } from "./HexColorField";

type TextStyleFieldsProps = {
  style: TextStyle;
  onChange: (next: TextStyle) => void;
  /** Inclusive size bounds for this text role. */
  sizeMin: number;
  sizeMax: number;
  /** Accessible name fragment, e.g. "title" / "description". */
  colorLabel: string;
};

/**
 * Shared typography controls for title and description:
 * font family, size, weight, and color.
 */
export function TextStyleFields({
  style,
  onChange,
  sizeMin,
  sizeMax,
  colorLabel,
}: TextStyleFieldsProps) {
  const patch = (partial: Partial<TextStyle>) => {
    onChange({ ...style, ...partial });
  };

  // If state holds a custom stack not in the list, keep it selectable.
  const fontOptions = isKnownFontStack(style.fontFamily)
    ? FONT_SELECTOR_OPTIONS
    : [{ value: style.fontFamily, label: "Custom" }, ...FONT_SELECTOR_OPTIONS];

  return (
    <VStack gap={3}>
      <Selector
        label="Font"
        size="sm"
        options={fontOptions}
        value={style.fontFamily}
        onChange={(fontFamily) => {
          void ensureFontLoaded(fontFamily);
          patch({ fontFamily });
        }}
        placeholder="Choose a font"
        hasSearch
        searchPlaceholder="Search fonts…"
      />

      <NumberInput
        label="Size"
        size="sm"
        value={style.fontSize}
        onChange={(fontSize) => {
          const next = Math.min(sizeMax, Math.max(sizeMin, fontSize));
          patch({ fontSize: next });
        }}
        min={sizeMin}
        max={sizeMax}
        step={1}
        isIntegerOnly
        units="px"
        description={`${sizeMin}–${sizeMax} px`}
      />

      <Selector
        label="Weight"
        size="sm"
        options={FONT_WEIGHT_SELECTOR_OPTIONS}
        value={weightToOptionValue(style.fontWeight)}
        onChange={(value) => {
          const weight = Number.parseInt(value, 10);
          if (!Number.isNaN(weight)) {
            patch({ fontWeight: weight });
          }
        }}
        placeholder="Weight"
      />

      <HexColorField
        label="Color"
        value={style.color}
        onChange={(color) => patch({ color })}
        description="Hex color for this text"
        pickerAriaLabel={`${colorLabel} color`}
      />
    </VStack>
  );
}
