import { useEffect, useId, useState } from "react";
import { Field } from "@astryxdesign/core/Field";
import { HStack } from "@astryxdesign/core/Layout";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useRafThrottledCallback } from "../../hooks/useRafThrottledCallback";
import { normalizeHex } from "../../state/color";

type HexColorFieldProps = {
  label?: string;
  value: string;
  onChange: (hex: string) => void;
  description?: string;
  pickerAriaLabel?: string;
};

/**
 * Compact hex text field + native color picker.
 * Picker drag updates local UI immediately and commits to parent at most
 * once per animation frame — keeps App/canvas from thrashing mid-drag.
 */
export function HexColorField({
  label = "Color",
  value,
  onChange,
  description,
  pickerAriaLabel = "Pick color",
}: HexColorFieldProps) {
  const colorInputId = useId();
  const [hexDraft, setHexDraft] = useState(value);
  const commitColor = useRafThrottledCallback(onChange);

  // Sync from parent when presets / reset / other sources change the color.
  useEffect(() => {
    setHexDraft((prev) => (prev === value ? prev : value));
  }, [value]);

  const pickerValue = normalizeHex(hexDraft) ?? "#000000";

  const commitPicker = (raw: string, immediate: boolean) => {
    const normalized = normalizeHex(raw);
    if (!normalized) {
      return;
    }

    setHexDraft(normalized);

    if (normalized === value) {
      return;
    }

    if (immediate) {
      onChange(normalized);
    } else {
      commitColor(normalized);
    }
  };

  const onHexDraftChange = (draft: string) => {
    setHexDraft(draft);
    const normalized = normalizeHex(draft);
    // Typing is low-frequency; commit immediately when valid.
    if (normalized && normalized !== value) {
      onChange(normalized);
    }
  };

  return (
    <HStack gap={3} vAlign="end">
      <TextInput
        label={label}
        value={hexDraft}
        onChange={onHexDraftChange}
        placeholder="#ffffff"
        size="sm"
        description={description}
      />
      <Field label="Picker" inputID={colorInputId}>
        <input
          id={colorInputId}
          type="color"
          className="color-picker-native"
          value={pickerValue}
          // Continuous while dragging — throttle parent updates.
          onInput={(e) => commitPicker(e.currentTarget.value, false)}
          // Final value when the OS picker closes / commits.
          onChange={(e) => commitPicker(e.currentTarget.value, true)}
          aria-label={pickerAriaLabel}
        />
      </Field>
    </HStack>
  );
}
