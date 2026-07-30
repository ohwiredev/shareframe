import { Check, Pipette } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { normalizeHex } from "../../state/color";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

type ColorFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

type Hsv = { h: number; s: number; v: number };

function hexToHsv(hex: string): Hsv {
  const number = Number.parseInt(hex.slice(1), 16);
  const r = ((number >> 16) & 255) / 255;
  const g = ((number >> 8) & 255) / 255;
  const b = (number & 255) / 255;
  const max = Math.max(r, g, b);
  const delta = max - Math.min(r, g, b);
  let h = 0;

  if (delta) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = (h * 60 + 360) % 360;
  }

  return { h, s: max ? delta / max : 0, v: max };
}

function hsvToHex({ h, s, v }: Hsv) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];

  return `#${[r, g, b]
    .map((channel) =>
      Math.round((channel + m) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

export function ColorField({ label, value, onChange }: ColorFieldProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value.toUpperCase());
  const hsv = hexToHsv(value);

  useEffect(() => setDraft(value.toUpperCase()), [value]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const updateSaturation = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const s = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
    const v = 1 - Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));
    onChange(hsvToHex({ ...hsv, s, v }));
  };

  const commitDraft = () => {
    const normalized = normalizeHex(draft);
    if (normalized) onChange(normalized);
    else setDraft(value.toUpperCase());
  };

  return (
    <div className="studio-color-field" ref={rootRef}>
      <Label htmlFor={id}>{label}</Label>
      <div className="studio-color-trigger">
        <button
          type="button"
          className="color-swatch-button"
          aria-label={`Open ${label.toLowerCase()} picker`}
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <span style={{ backgroundColor: value }} />
          <Pipette size={14} />
        </button>
        <Input
          id={id}
          value={draft}
          maxLength={7}
          spellCheck={false}
          onChange={(event) => setDraft(event.currentTarget.value.toUpperCase())}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
        />
      </div>

      {open && (
        <div className="color-popover" role="dialog" aria-label={`${label} picker`}>
          <div
            className="color-saturation"
            style={{ backgroundColor: `hsl(${hsv.h} 100% 50%)` }}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              updateSaturation(event);
            }}
            onPointerMove={(event) =>
              event.currentTarget.hasPointerCapture(event.pointerId) && updateSaturation(event)
            }
          >
            <span
              className="color-cursor"
              style={{
                left: `${hsv.s * 100}%`,
                top: `${(1 - hsv.v) * 100}%`,
                backgroundColor: value,
              }}
            />
          </div>
          <label className="color-hue">
            <span>Hue</span>
            <input
              type="range"
              min="0"
              max="359"
              value={Math.round(hsv.h)}
              aria-label={`${label} hue`}
              onChange={(event) =>
                onChange(hsvToHex({ ...hsv, h: Number(event.currentTarget.value) }))
              }
            />
          </label>
          <div className="color-popover-footer">
            <span className="color-preview" style={{ backgroundColor: value }} />
            <code>{value.toUpperCase()}</code>
            <button type="button" onClick={() => setOpen(false)} aria-label="Done">
              <Check size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
