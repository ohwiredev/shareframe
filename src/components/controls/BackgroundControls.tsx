import { memo } from "react";
import { Grid } from "@astryxdesign/core/Grid";
import { VStack } from "@astryxdesign/core/Layout";
import { Text } from "@astryxdesign/core/Text";
import { BACKGROUND_PRESETS } from "../../state/backgroundPresets";
import { hexEquals } from "../../state/color";
import { ControlSection } from "../ControlSection";
import { HexColorField } from "./HexColorField";

type BackgroundControlsProps = {
  backgroundColor: string;
  onChange: (backgroundColor: string) => void;
};

/**
 * Solid color presets + custom hex / native color picker.
 * Updates `EditorState.backgroundColor` → canvas redraws live.
 */
export const BackgroundControls = memo(function BackgroundControls({
  backgroundColor,
  onChange,
}: BackgroundControlsProps) {
  return (
    <ControlSection
      title="Background"
      description="Pick a solid preset or enter a custom color."
    >
      <VStack gap={3}>
        <VStack gap={1}>
          <Text type="label" weight="medium">
            Presets
          </Text>
          <Grid columns={4} gap={2}>
            {BACKGROUND_PRESETS.map((preset) => {
              const selected = hexEquals(backgroundColor, preset.color);
              return (
                <button
                  key={preset.id}
                  type="button"
                  className="color-swatch"
                  data-selected={selected ? "true" : "false"}
                  style={{ backgroundColor: preset.color }}
                  aria-label={`${preset.label} (${preset.color})`}
                  aria-pressed={selected}
                  title={preset.label}
                  onClick={() => onChange(preset.color)}
                />
              );
            })}
          </Grid>
        </VStack>

        <HexColorField
          label="Hex"
          value={backgroundColor}
          onChange={onChange}
          description="6-digit hex (e.g. #1a1a2e)"
          pickerAriaLabel="Custom background color"
        />
      </VStack>
    </ControlSection>
  );
});
