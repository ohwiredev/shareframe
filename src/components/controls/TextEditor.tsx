import { useId } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, Search } from "lucide-react";
import {
  GOOGLE_FONTS,
  SYSTEM_FONTS,
  type FontOption,
} from "../../state/fonts";
import type { TextStyle } from "../../state/types";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { ColorField } from "./ColorField";
import { AlignmentField } from "./AlignmentField";
import { RangeField } from "./RangeField";

type TextEditorProps = {
  label: string;
  style: TextStyle;
  multiline?: boolean;
  onChange: (style: TextStyle) => void;
};

type FontGroup = {
  value: string;
  items: FontOption[];
};

const FONT_GROUPS: FontGroup[] = [
  { value: "System fonts", items: SYSTEM_FONTS },
  { value: "Google fonts", items: GOOGLE_FONTS },
];

type FontComboboxProps = {
  id: string;
  value: FontOption | null;
  onValueChange: (font: FontOption) => void;
};

function FontCombobox({ id, value, onValueChange }: FontComboboxProps) {
  return (
    <Combobox.Root
      items={FONT_GROUPS}
      value={value}
      openOnInputClick
      isItemEqualToValue={(font, selected) => font.id === selected.id}
      onValueChange={(font) => {
        if (font) onValueChange(font);
      }}
    >
      <Combobox.InputGroup data-slot="font-combobox-input-group">
        <Search aria-hidden="true" size={14} />
        <Combobox.Input
          id={id}
          data-slot="font-combobox-input"
          placeholder="Search fonts..."
        />
        <Combobox.Trigger
          data-slot="font-combobox-trigger"
          aria-label="Open font menu"
        >
          <ChevronDown aria-hidden="true" size={15} />
        </Combobox.Trigger>
      </Combobox.InputGroup>
      <Combobox.Portal>
        <Combobox.Positioner
          data-slot="font-combobox-positioner"
          sideOffset={4}
        >
          <Combobox.Popup data-slot="font-combobox-popup">
            <Combobox.Empty data-slot="font-combobox-empty">
              No fonts found
            </Combobox.Empty>
            <Combobox.List data-slot="font-combobox-list">
              {(group: FontGroup) => (
                <Combobox.Group key={group.value} items={group.items}>
                  <Combobox.GroupLabel data-slot="font-combobox-group-label">
                    {group.value}
                  </Combobox.GroupLabel>
                  <Combobox.Collection>
                    {(font: FontOption) => (
                      <Combobox.Item
                        key={font.id}
                        value={font}
                        data-slot="font-combobox-item"
                      >
                        <span>{font.label}</span>
                        <Combobox.ItemIndicator data-slot="font-combobox-item-indicator">
                          <Check aria-hidden="true" size={14} />
                        </Combobox.ItemIndicator>
                      </Combobox.Item>
                    )}
                  </Combobox.Collection>
                </Combobox.Group>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

export function TextEditor({
  label,
  style,
  multiline,
  onChange,
}: TextEditorProps) {
  const contentId = useId();
  const fontId = useId();
  const weightId = useId();
  const selectedFont = [...SYSTEM_FONTS, ...GOOGLE_FONTS].find(
    (font) => font.stack === style.fontFamily,
  );
  const weightLabel =
    { 400: "Regular", 500: "Medium", 600: "Semibold", 700: "Bold" }[
      style.fontWeight
    ] ?? String(style.fontWeight);

  return (
    <section className="studio-section">
      <h2>{label}</h2>
      <div className="studio-field">
        <Label htmlFor={contentId}>Content</Label>
        {multiline ? (
          <Textarea
            id={contentId}
            rows={3}
            value={style.content}
            onChange={(event) =>
              onChange({ ...style, content: event.currentTarget.value })
            }
          />
        ) : (
          <Input
            id={contentId}
            value={style.content}
            onChange={(event) =>
              onChange({ ...style, content: event.currentTarget.value })
            }
          />
        )}
      </div>
      <div className="studio-field">
        <Label htmlFor={fontId}>Font family</Label>
        <FontCombobox
          id={fontId}
          value={selectedFont ?? null}
          onValueChange={(font) =>
            onChange({ ...style, fontFamily: font.stack })
          }
        />
      </div>
      <RangeField
        label="Size"
        value={style.fontSize}
        min={multiline ? 14 : 24}
        max={multiline ? 64 : 120}
        step={1}
        display={`${style.fontSize}px`}
        onChange={(fontSize) => onChange({ ...style, fontSize })}
      />
      <details className="typography-advanced">
        <summary>
          Advanced options
          <ChevronDown size={15} />
        </summary>
        <div className="studio-field compact">
          <Label htmlFor={weightId}>Weight</Label>
          <Select
            value={String(style.fontWeight)}
            onValueChange={(fontWeight) =>
              onChange({ ...style, fontWeight: Number(fontWeight) })
            }
          >
            <SelectTrigger id={weightId}>
              <SelectValue>{weightLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="400">Regular</SelectItem>
              <SelectItem value="500">Medium</SelectItem>
              <SelectItem value="600">Semibold</SelectItem>
              <SelectItem value="700">Bold</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <RangeField
          label="Width"
          value={style.width}
          min={30}
          max={100}
          step={1}
          display={`${style.width}%`}
          onChange={(width) => onChange({ ...style, width })}
        />
        <ColorField
          label={`${label} color`}
          value={style.color}
          onChange={(color) => onChange({ ...style, color })}
        />
        <AlignmentField
          value={style.alignment}
          onChange={(alignment) => onChange({ ...style, alignment })}
        />
      </details>
    </section>
  );
}
