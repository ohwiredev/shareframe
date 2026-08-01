# Shareframe Design System (DESIGN.md)

This document establishes the authoritative design guidelines, visual tokens, and UI patterns for **Shareframe**. All components, controls, layouts, and canvas chrome must strictly follow these rules to maintain consistent typography, color fidelity, spacing rhythm, and border radii across the application.

---

## 1. Architectural Design Principles

1. **shadcn/ui for Chrome, Canvas for Image Output**  
   All editor controls, modals, popovers, and layout panels use shadcn/ui components customized with project-specific Tailwind CSS variables (`base-luma` style, `taupe` base theme, deep violet brand accents).
2. **Single-Source Editor State**  
   Controls and the preview canvas share a reactive editor state. Visual modifications in the controls panel reflect immediately in the **1200 × 630** live canvas stage.
3. **Canvas sRGB Color Fidelity**  
   The preview and exported image share the same Canvas 2D composition pipeline with explicit sRGB output so that colors in the UI match exported PNG/JPG/WebP assets pixel-for-pixel.
4. **Dark Studio Aesthetic**  
   The primary application workspace uses a high-contrast, low-glare dark studio theme (`#0c0c0e` root canvas background) to make colors, templates, and imagery pop.

---

## 2. Typography System

### 2.1 Font Families

| Role | Font Family | Variable / Fallbacks | Usage |
| :--- | :--- | :--- | :--- |
| **Primary UI / Body** | **Inter Variable** | `"Inter Variable", Inter, ui-sans-serif, system-ui, sans-serif` | App shell, navigation, toolbars, buttons, form controls, labels, and helper text |
| **Heading / Display** | **Public Sans Variable** | `"Public Sans Variable", sans-serif` | Major headings, template display titles, and prominent section banners |
| **Canvas Text** | **System + Google Fonts** | Selectable per text element (e.g., *Inter*, *Public Sans*, *Roboto*, *Outfit*, etc.) | User-configurable title and description typography rendered on the OG canvas |

### 2.2 UI Type Hierarchy & Styles

Keep typography weights, sizes, and line-heights consistent across all editor panels:

| Component Role | Font Size | Font Weight | Line Height | Letter Spacing | Color Token / Value |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Panel Heading (`h1`)** | `25px` (`1.5625rem`) | `600`–`700` | `1.25` | Normal | `#f4f4f6` (`var(--foreground)`) |
| **Panel Subtitle (`.sub`)** | `13px` (`0.8125rem`) | `400` | `1.55` | Normal | `#85858f` (`var(--muted-foreground)`) |
| **Eyebrow (`.eyebrow`)** | `10px` (`0.625rem`) | `800` | `1.2` | `0.16em` | `#8275ff` (Brand Violet Accent) |
| **Field Label** | `12px` (`0.75rem`) | `650` (`font-semibold`) | `1.4` | Normal | `#e7e7e9` / `#9696a1` |
| **Button Text (Primary/Secondary)** | `12px` (`0.75rem`) | `500`–`600` | `1.25` | Normal | `white` / `#bdbdc5` |
| **Tool Sidebar Label** | `10px` (`0.625rem`) | `500` | `1.1` | Normal | `#777783` (Active: `#9b91ff`) |
| **Small / Meta Caption** | `9px`–`11px` | `400`–`500` | `1.35` | `0.12em` (caps) | `#72717c` / `#888895` |

---

## 3. Colour System & Theme Tokens

### 3.1 Dark Studio Palette

The studio UI relies on deep neutral backgrounds paired with vibrant violet accents for interactive controls:

| Color Role | Hex Value | OKLCH Token Reference | Usage |
| :--- | :--- | :--- | :--- |
| **Studio Root (`.production-studio`)** | `#0c0c0e` | `oklch(0.147 0.004 49.3)` | Overall full-bleed page background |
| **Surface / Card Level 1** | `#141417` | `oklch(0.214 0.009 43.1)` | Template cards, interactive list containers |
| **Surface / Card Level 2** | `#151518` | — | Toolbar buttons, color trigger inputs, actions |
| **Surface Popover / Menu** | `#1b1b1f` / `#1c1c20` | `oklch(0.214 0.009 43.1)` | Color picker dropdowns, export menus, modals |
| **Brand Primary Violet** | `#695cff` | `oklch(0.424 0.199 265.638)` | Primary action buttons, brand logo badge, active pills |
| **Brand Action Button** | `#6657f6` | — | Primary header CTA (`.d1-actions .primary`) |
| **Interactive Outline / Ring** | `#887bff` | `oklch(0.547 0.021 43.1)` | Selected card outline (`outline: 2px solid #887bff`) |
| **Active Accent Wash** | `#695cff18` | — | Selected tool sidebar item background |
| **Destructive / Error** | `#ff7d8a` | `oklch(0.704 0.191 22.216)` | Remove logo link, render error messages |

### 3.2 Border & Divider Hierarchy

All borders use white alpha-transparency to create subtle separation against dark surfaces without harsh contrast:

- **Subtle Divider / Grid Border**: `#ffffff10` (`10%` alpha) — Panel dividers, tools column right border.
- **Default Control Border**: `#ffffff14` (`12%`–`14%` alpha) — Template cards, standard input fields.
- **Enhanced Interactive Border**: `#ffffff18` (`16%`–`18%` alpha) — Color swatches, export menus, preview container border.
- **Hover / Active Border**: `#ffffff28` (`25%`–`28%` alpha) — Template card hover state, upload drop zones.

### 3.3 Stage Background Lighting

The preview stage container (`.d1-stage`) uses a subtle radial ambient light to frame the Open Graph canvas:

```css
.d1-stage {
  background: radial-gradient(circle at 50% 40%, #292550 0, transparent 42%);
}
```

---

## 4. Spacing, Sizing & Layout Grid

### 4.1 Root Layout Dimensions

The application shell uses a fixed 3-column layout grid:

```text
+-----------------------------------------------------------------------+
|  d1-header (Height: 68px, Padding: 0 24px)                            |
+-----------+------------------------------------+----------------------+
|  d1-tools |  d1-panel                          |  d1-stage            |
|  (76px)   |  (340px fixed width, scrollable)   |  (1fr fluid width)   |
|           |  Padding: 34px 28px                |  Padding: 35px 5vw   |
+-----------+------------------------------------+----------------------+
```

- **Header (`.d1-header`)**: Fixed `68px` height, horizontal padding `24px`.
- **Tools Sidebar (`.d1-tools`)**: Fixed width `76px`, vertical padding `23px`, horizontal padding `10px`.
- **Controls Editor Panel (`.d1-panel`)**: Fixed width `340px`, padding `34px 28px`, vertical overflow scroll.
- **Preview Canvas Stage (`.d1-stage`)**: Flex `1fr`, padding `35px 5vw`, vertically centered.

### 4.2 Component Spacing Scale

Use these standard gap and margin increments for all editor UI components:

| Spacing Token | Pixels | Rem Value | Application |
| :--- | :--- | :--- | :--- |
| `space-1` | `4px` | `0.25rem` | Inner icon/text gaps, swatch sub-elements |
| `space-2` | `8px` | `0.5rem` | Sidebar tool button gaps, form label margins, action buttons |
| `space-2.5` | `10px` | `0.625rem` | Template card inner padding, gradient swatch grid gap |
| `space-3.5` | `14px` | `0.875rem` | Form field vertical bottom margin (`margin-bottom: 14px`) |
| `space-4` | `16px` | `1.0rem` | Between stacked control cards or section groups |
| `space-6` | `24px` | `1.5rem` | Below color swatch grids, major header horizontal padding |
| `space-7` | `28px` | `1.75rem` | Horizontal panel padding, section rule margins |
| `space-8` | `34px` | `2.125rem` | Top/bottom padding for the primary controls editor panel |

### 4.3 Canvas Aspect Ratio & Fixed Resolution

- **OG Image Aspect Ratio**: Always **`1200 / 630`** (`1.90476`).
- **Preview Scaling**: The `.functional-preview` container scales fluidly with CSS while preserving `aspect-ratio: 1200 / 630`.
- **Export Resolution**: OffscreenCanvas export output is strictly **1200 × 630 pixels** regardless of preview zoom.

---

## 5. Border Radius System

### 5.1 Radius Token Scale

The project defines a root base radius of **`--radius: 0.875rem` (14px)** in `src/index.css`. All rounded elements derive from this scale or use explicit standardized pixel values:

| Token | CSS Variable / Calc | Approx. PX Value | Target UI Elements |
| :--- | :--- | :--- | :--- |
| **`--radius-sm`** | `calc(var(--radius) * 0.6)` | `8.4px` (~`8px`) | Small buttons, color swatches, input trigger boxes |
| **`--radius-md`** | `calc(var(--radius) * 0.8)` | `11.2px` (~`10px`) | Dropdown menus, export popovers, upload zones |
| **`--radius-lg` / Base** | `var(--radius)` | `14px` (`12px`–`14px`) | Template cards (`12px`), Canvas preview stage card (`14px`) |
| **`--radius-xl`** | `calc(var(--radius) * 1.4)` | `19.6px` | Large modal dialogs |
| **`--radius-full`** | `999px` | `999px` | Category pills, color hue sliders, circular handles |

### 5.2 Specific Component Radius Rules

- **Standard Buttons (`.d1-actions button`, swatches)**: Exactly `8px` (`border-radius: 8px`).
- **Sidebar Tool Icons (`.d1-tools button`)**: Exactly `9px` (`border-radius: 9px`).
- **Brand Logo Icon Box (`.brand > span`)**: Exactly `9px` (`border-radius: 9px`).
- **Template Cards (`.studio-template-card`)**: Exactly `12px` (`border-radius: 12px`).
- **Canvas Preview Frame (`.functional-preview`)**: Exactly `14px` (`border-radius: 14px`).
- **Color Picker / Saturation Pad (`.color-saturation`)**: Exactly `8px` (`border-radius: 8px`).
- **Popovers & Menus (`.export-menu`, `.color-popover`)**: `10px`–`12px` (`border-radius: 10px` / `12px`).
- **Pills & Badges**: Fully rounded (`border-radius: 999px`).

---

## 6. Interactive States & Micro-Interactions

### 6.1 Hover & Selection Transitions

- **Hover Elevation**: Interactive cards and swatches lift smoothly on hover:
  ```css
  transition: transform 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;
  transform: translateY(-2px);
  ```
- **Selected Outline Ring**: When a template, swatch, or gradient preset is selected, highlight with an offset ring:
  ```css
  outline: 2px solid #887bff;
  outline-offset: 2px;
  ```
- **Active Sidebar Item**: Selected tool in `.d1-tools` uses a soft violet background wash:
  ```css
  background: #695cff18;
  color: #9b91ff;
  ```

### 6.2 Focus & Accessibility

- **Keyboard Focus**: Use `outline-ring/50` with clear focus rings on all interactive inputs, triggers, and buttons.
- **Button Cursors**: Ensure all clickable elements explicitly specify `cursor: pointer`.

---

## 7. Consistency Checklist for New UI Work

When building new components or modifying existing panels, verify:

- [ ] **Typography**: Uses `Inter Variable` for controls and `Public Sans Variable` for headers; matches the sizing and weight hierarchy in Table 2.2.
- [ ] **Color Palette**: Uses existing alpha borders (`#ffffff10`–`#ffffff18`) and brand violet tokens (`#695cff`, `#887bff`). No ad-hoc bright or uncalibrated colors.
- [ ] **Border Radius**: Maps correctly to the border radius scale (`8px`/`9px` for buttons/swatches, `12px` for cards, `14px` for preview frames, `999px` for pills).
- [ ] **Spacing**: Respects the `8px`/`14px`/`16px`/`24px` spacing scale and keeps panel padding at `34px 28px`.
- [ ] **OG Resolution**: Preserves `1200 / 630` aspect ratio in preview and output.
