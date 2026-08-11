---
name: generate-templates
description: Create, generate, design, and register Open Graph image templates for Shareframe (og-snap). Use when adding new built-in templates, creating JSON template definitions in src/templates/definitions/, registering templates in src/templates/index.ts, or configuring template layout presets, e-commerce product cards, blog OG cards, or minimal solid/gradient themes. Includes comprehensive documentation of all OgTemplate and TemplateState properties, canvas coordinate systems, typography, backgrounds, overlay images, e-commerce badges, prices, and star ratings.
metadata:
  author: shareframe
  version: "1.0.0"
---

# Shareframe Template Generation Skill

Shareframe uses a single-source **JSON template system** to generate 1200×630 Open Graph images. Each template defines a layout, color scheme, typography hierarchy, and optional overlay components (images, e-commerce badges, pricing, and ratings).

When generating or adding templates to Shareframe, follow the specifications, property definitions, and workflow documented below.

---

## Architecture & Workflow

### 1. Template Definition File
Create a new JSON file in `src/templates/definitions/<id>.json`. The filename must match the template's kebab-case `id` property.

### 2. Automatic Registry Registration
Shareframe automatically discovers and registers all template definitions in `src/templates/definitions/*.json` at dev and build time using Vite's `import.meta.glob`:

```ts
const templateModules = import.meta.glob<OgTemplate | { default: OgTemplate }>(
  "./definitions/*.json",
  { eager: true },
);

export const BUILTIN_TEMPLATES: OgTemplate[] = Object.values(templateModules).map(
  (mod) => ("default" in mod ? mod.default : mod),
);
```

No manual imports or updates in `src/templates/index.ts` are required. Simply creating a `<id>.json` file in `src/templates/definitions/` auto-registers it instantly.

### 3. How Templates Apply (`applyTemplate`)
When a user selects a template, `applyTemplate(currentState, template)` in `src/templates/index.ts` normalizes state into a declarative elements array (`elements: CanvasElement[]`) and merges template styling onto the active canvas:
- **Normalization**: Structured fields (`title`, `description`, `logo`, `image`, `badge`, `price`, `rating`) or direct `elements` are converted into normalized `CanvasElement` objects via `normalizeState()`.
- **Background**: Replaced by `template.state.background` (or preserved if omitted).
- **Logo**: Updates positioning (`y`, `scale`, `alignment`) while preserving the user's uploaded logo unless the template defines an explicit `src` override.
- **Elements Array**: Applies typography, positioning, overlay images, e-commerce badges, prices, ratings, and shapes.

---

## Top-Level `OgTemplate` Properties

Every template JSON definition must conform to the `OgTemplate` interface:

| Property | Type | Required | Default / Example | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | **Yes** | `"ecommerce-promo"` | Unique kebab-case identifier. Must exactly match the definition filename (`src/templates/definitions/<id>.json`). |
| `name` | `string` | **Yes** | `"Product Card"` | Display name shown in the UI template selector card. Keep concise (2–4 words). |
| `description` | `string` | **Yes** | `"Sleek dark-mode luxury product card..."` | Human-readable description of layout, style, and ideal use case. Shown in tooltips and preview details. |
| `category` | `string` | Optional | `"E-Commerce"` | Layout category tab used to filter templates in the UI. Standard categories: `"With Image"`, `"Gradient"`, `"E-Commerce"`, `"Solid"`. |
| `badge` | `string` | Optional | `"Luxury"` | Short tag badge displayed in the corner of the template picker card (e.g., `"Hero"`, `"Product"`, `"Minimal"`, `"Blog"`, `"Release"`). |
| `state` | `TemplateState` | **Yes** | `{ ... }` | Partial canvas state object defining backgrounds, typography, layouts, images, and badges. |

---

## `TemplateState` Property Reference

The `state` object inside an `OgTemplate` controls what is rendered on the 1200×630 canvas. Templates can specify direct `elements` array or structured component properties (which `normalizeState()` automatically maps into elements).

```json
"state": {
  "background": { ... },
  "elements": [ ... ],
  "logo": { ... },
  "title": { ... },
  "description": { ... },
  "image": { ... },
  "badge": { ... },
  "price": { ... },
  "originalPrice": { ... },
  "rating": { ... }
}
```

> **Note on `elements` vs structured properties:** Shareframe's runtime normalizes all template state into a unified `elements: CanvasElement[]` array. You can define templates using structured properties (`logo`, `title`, `description`, `image`, `badge`, `price`, `rating`), or directly pass a custom `elements` array containing `text`, `image`, `logo`, `badge`, `price`, `rating`, or `shape` elements.

---

### 1. `background` (`TemplateBackground`)
Controls the canvas fill. Can be either a solid color or a gradient.

#### Solid Background (`SolidBackground`)
```json
"background": {
  "type": "solid",
  "color": "#09090b"
}
```
| Property | Type | Required | Purpose |
| :--- | :--- | :--- | :--- |
| `type` | `"solid"` | **Yes** | Must be `"solid"`. |
| `color` | `string` | **Yes** | Hex CSS color string for the canvas background (e.g., `"#09090b"`, `"#f5f5f4"`). |

#### Gradient Background (`GradientBackground`)
```json
"background": {
  "type": "gradient",
  "style": "radial",
  "angle": 135,
  "cx": 0.75,
  "cy": 0.5,
  "radius": "farthest-corner",
  "colors": ["#1e293b", "#090d16"],
  "stops": [0, 1]
}
```
| Property | Type | Required | Default | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `type` | `"gradient"` | **Yes** | — | Must be `"gradient"`. |
| `style` | `"linear" \| "radial"` | Optional | `"linear"` | Gradient rendering mode on the Canvas 2D context. |
| `angle` | `number` | Optional | `135` | Linear gradient angle in degrees (`0`–`360`). `135` is top-left to bottom-right. |
| `cx` | `number` | Optional | `0.5` | Radial gradient center X coordinate as a fraction of canvas width (`0.0` to `1.0`). |
| `cy` | `number` | Optional | `0.5` | Radial gradient center Y coordinate as a fraction of canvas height (`0.0` to `1.0`). |
| `radius` | `"farthest-corner" \| number` | Optional | `"farthest-corner"` | Radial radius on the 1200×630 canvas. `"farthest-corner"` matches CSS standard; numbers specify absolute pixels. |
| `colors` | `string[]` | **Yes** | — | Array of hex color strings (at least 2 colors required). |
| `stops` | `number[]` | Optional | Evenly spaced | Array of color stop offsets (`0.0` to `1.0`) matching the length of `colors`. |

---

### 2. `logo` (`TemplateLogo`)
Configures the logo size, position, and alignment on the canvas.

```json
"logo": {
  "y": 0.1,
  "scale": 0.85,
  "alignment": "center",
  "src": null
}
```
| Property | Type | Optional | Default / Range | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `y` | `number` | Yes | `0.0` – `1.0` | Vertical placement as a fraction of canvas height (`0.1` = top header, `0.92` = bottom footer). |
| `scale` | `number` | Yes | `0.3` – `1.5` | Scale factor relative to default logo size (`1.0` = 100%, `0.55` = small footer mark). |
| `alignment` | `"left" \| "center" \| "right"` | Yes | `"center"` | Horizontal positioning within the canvas safe area. |
| `src` | `string \| null` | Yes | `null` | Optional default logo image source URL or SVG data URI. Keep `null` to preserve the user's uploaded logo. |

---

### 3. `title` & `description` (`TemplateTextStyle`)
Typography settings for the primary title and subtitle.

```json
"title": {
  "content": "The Complete Guide to Modern Frontend Architecture",
  "fontFamily": "Space Grotesk",
  "fontSize": 52,
  "width": 85,
  "fontWeight": 700,
  "color": "#ffffff",
  "alignment": "center",
  "yOffset": 10
}
```
| Property | Type | Optional | Range / Example | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `content` | `string` | Yes | `"Header text..."` | Default text string populated when template is applied. |
| `fontFamily` | `string` | Yes | `"Inter"`, `"Space Grotesk"`, `"Plus Jakarta Sans"`, `"Outfit"`, `"Roboto"` | Font family name. Ensure it is a system font or Google Font loaded in the app. |
| `fontSize` | `number` | Yes | `12` – `120` | Font size in canvas pixels. Recommended: `48`–`68` for titles, `18`–`24` for descriptions. |
| `width` | `number` | Yes | `10` – `100` | Maximum wrapping width as a percentage of the canvas safe area (`100` = full width, `70` = narrow column). |
| `fontWeight` | `number` | Yes | `400` – `800` | Numeric font weight (`400` = normal, `600` = semibold, `700` = bold, `800` = extra bold). |
| `color` | `string` | Yes | `"#ffffff"` | Hex color string for the rendered text. |
| `alignment` | `"left" \| "center" \| "right"` | Yes | `"left"` | Horizontal text alignment and block anchoring. |
| `yOffset` | `number` | Yes | `-200` to `200` | Fine-tuned vertical adjustment in canvas pixels to balance padding above/below images. |

---

### 4. `image` (`TemplateImage`)
Controls overlay feature cards, screenshots, product photos, mockups, or SVG illustrations.

```json
"image": {
  "src": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
  "position": "left",
  "scale": 0.85,
  "borderRadius": 20,
  "shadow": true,
  "shadowBlur": 40,
  "yOffset": 0
}
```
| Property | Type | Optional | Range / Valid Values | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `enabled` | `boolean` | Yes | `true` \| `false` | Explicitly enables or disables overlay image rendering. |
| `src` | `string \| null` | Yes | URL or SVG data URI | Default image source. Can be an Unsplash URL, data URI, or null. |
| `position` | `"bottom" \| "right" \| "left"` | Yes | `"bottom"` | Layout mode: `"bottom"` stacks image below text; `"right"`/`"left"` creates a 2-column split layout. |
| `scale` | `number` | Yes | `0.4` – `1.2` | Scaling multiplier relative to the allocated image slot size. |
| `borderRadius` | `number` | Yes | `0` – `48` | Rounded corner radius in canvas pixels. |
| `shadow` | `boolean` | Yes | `true` \| `false` | Whether to render a Canvas 2D drop shadow around the image frame. |
| `shadowBlur` | `number` | Yes | `0` – `64` | Blur radius intensity of the drop shadow. |
| `yOffset` | `number` | Yes | `-80` to `80` | Vertical offset adjustment in pixels for the image card. |

---

### 5. `badge` (`TemplateBadge`)
Renders an e-commerce or promotional pill badge above the title.

```json
"badge": {
  "text": "LIMITED EDITION",
  "color": "#ffffff",
  "background": "#6366f1"
}
```
| Property | Type | Optional | Example | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `text` | `string` | Yes | `"BESTSELLER"`, `"NEW"`, `"SALE"` | Label text displayed inside the badge pill. |
| `color` | `string` | Yes | `"#ffffff"` | Text hex color. |
| `background` | `string` | Yes | `"#10b981"`, `"#6366f1"` | Solid hex color fill for the pill badge background. |

---

### 6. `price` & `originalPrice` (`TemplatePrice`)
Renders product pricing information below the description.

```json
"price": {
  "text": "$199",
  "color": "#10b981",
  "fontSize": 28,
  "yOffset": 20
},
"originalPrice": {
  "text": "$299",
  "color": "#a8a29e"
}
```
| Property | Type | Optional | Default / Example | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `text` | `string` | Yes | `"$199"` | Display price string. |
| `color` | `string` | Yes | `"#10b981"` | Hex color string. Typically green/accent for `price` and muted grey for `originalPrice`. |
| `fontSize` | `number` | Yes | `28` (price) / `20` (original) | Font size in canvas pixels. |
| `yOffset` | `number` | Yes | `20` | Vertical offset relative to text flow. |

---

### 7. `rating` (`TemplateRating`)
Renders a star rating row (with filled/half stars) and review count.

```json
"rating": {
  "value": 4.8,
  "color": "#f59e0b",
  "reviewCount": "256 reviews"
}
```
| Property | Type | Optional | Range / Example | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `value` | `number` | Yes | `0.0` – `5.0` | Numeric star rating (supports halves, e.g., `4.5` or `4.8`). |
| `color` | `string` | Yes | `"#f59e0b"` | Hex color string for the filled stars. |
| `reviewCount` | `string` | Yes | `"256 reviews"` | Text label displayed after the stars. |

---

## Complete Template Example: E-Commerce Product Showcase

Here is a full example of a production-ready template JSON (`src/templates/definitions/ecommerce-showcase.json`):

```json
{
  "id": "ecommerce-showcase",
  "name": "Product Showcase",
  "description": "Split-left product image with name, price, rating, and bestseller badge — ideal for e-commerce product shares.",
  "category": "E-Commerce",
  "badge": "Product",
  "state": {
    "background": {
      "type": "solid",
      "color": "#f5f5f4"
    },
    "logo": {
      "y": 0.92,
      "scale": 0.55,
      "alignment": "left",
      "src": null
    },
    "title": {
      "content": "Premium Wireless Headphones",
      "fontFamily": "Plus Jakarta Sans",
      "fontSize": 48,
      "width": 100,
      "fontWeight": 700,
      "color": "#1c1917",
      "alignment": "left",
      "yOffset": -30
    },
    "description": {
      "content": "Active Noise Cancellation · 30-hour Battery Life · Premium Sound Quality",
      "fontFamily": "Inter",
      "fontSize": 18,
      "width": 100,
      "fontWeight": 400,
      "color": "#57534e",
      "alignment": "left",
      "yOffset": -40
    },
    "image": {
      "src": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
      "position": "left",
      "scale": 0.85,
      "borderRadius": 20,
      "shadow": false,
      "shadowBlur": 40,
      "yOffset": 0
    },
    "price": {
      "text": "$199",
      "color": "#10b981",
      "fontSize": 28,
      "yOffset": 20
    },
    "originalPrice": {
      "text": "$299",
      "color": "#a8a29e"
    },
    "rating": {
      "value": 4.8,
      "color": "#f59e0b",
      "reviewCount": "256 reviews"
    }
  }
}
```

---

## Design Best Practices for Shareframe Templates

1. **Fixed 1200×630 Target Area**: All coordinates, font sizes, and radii are mapped to the standard 1200×630 Open Graph resolution.
2. **Harmonious Palettes**:
   - Ensure high contrast between text (`color`) and background (`background.color` or gradient colors).
   - Use curated dark slate/zinc palettes (e.g., `#09090b`, `#0f172a`, `#1e293b`) or crisp light stones (e.g., `#f5f5f4`, `#fafafa`).
3. **Typography Scaling**:
   - For `position: "left"` or `position: "right"` split layouts, set `width` to `100` so text fills its half-column cleanly.
   - For centered `position: "bottom"` hero cards or text-only templates, set `width` between `70` and `85` to avoid edge collision.
4. **Logo Placement**:
   - Use `y: 0.1` for top headers and `y: 0.92` for bottom footers.
   - Set `src: null` in default templates so a user's uploaded logo is preserved when switching templates.
5. **Overlay Image Radii & Shadows**:
   - Recommended `borderRadius`: `16` to `24`.
   - Use soft `shadowBlur` (`36` to `48`) for elevation on dark gradients.
