# Creating Custom Open Graph Templates in Shareframe

Shareframe features a modular, JSON-driven **template system** that makes it easy to add custom **1200×630 Open Graph image templates**. Whether you are building branded social cards for your SaaS product, e-commerce store, blog, or newsletter, you can define new templates using a single JSON file—or let AI assistants generate them for you.

---

## 📖 Table of Contents
- [How Templates Work](#how-templates-work)
- [Step-by-Step: Creating a Template Hand-Coded](#step-by-step-creating-a-template-hand-coded)
- [Using AI Assistants to Generate Templates](#using-ai-assistants-to-generate-templates)
- [Template Property Reference](#template-property-reference)
- [Complete Reference Examples](#complete-reference-examples)
- [Design Best Practices](#design-best-practices)

---

## ⚙️ How Templates Work

In Shareframe, every template is defined as a standalone JSON object adhering to the `OgTemplate` schema and stored in `src/templates/definitions/`. 

When a user selects a template in the editor, Shareframe's `applyTemplate` engine merges the template's canvas `state` into the active editor:
- **Backgrounds**: Automatically applies solid hex colors or multi-stop linear/radial gradients.
- **Typography**: Configures font family, font size, weight, color, alignment, width wrapping percentage, and vertical offsets for titles and descriptions.
- **Logo Placement**: Adjusts logo scale, vertical anchor (`y`), and horizontal alignment while preserving any logo image the user has uploaded.
- **Overlay Cards & Extras**: Optional overlay screenshots/product images, promotional pill badges, prices, and customer star ratings.

---

## 🛠️ Step-by-Step: Creating a Template Hand-Coded

### Step 1: Create Your Template JSON File
Create a new file in `src/templates/definitions/` named with your template's kebab-case ID (e.g., `my-custom-card.json`):

```json
{
  "id": "my-custom-card",
  "name": "Custom Announcement",
  "description": "A high-contrast centered announcement card with a vibrant linear gradient background.",
  "category": "Gradient",
  "badge": "New",
  "state": {
    "background": {
      "type": "gradient",
      "style": "linear",
      "angle": 135,
      "colors": ["#0f172a", "#1e1b4b", "#312e81"]
    },
    "logo": {
      "y": 0.12,
      "scale": 0.85,
      "alignment": "center",
      "src": null
    },
    "title": {
      "content": "Announcing Our Major 2.0 Release",
      "fontFamily": "Space Grotesk",
      "fontSize": 56,
      "width": 85,
      "fontWeight": 700,
      "color": "#ffffff",
      "alignment": "center",
      "yOffset": 0
    },
    "description": {
      "content": "Faster exports, customizable templates, and an improved Canvas 2D rendering pipeline.",
      "fontFamily": "Inter",
      "fontSize": 20,
      "width": 75,
      "fontWeight": 400,
      "color": "#c7d2fe",
      "alignment": "center",
      "yOffset": 12
    }
  }
}
```

### Step 2: Register in `src/templates/index.ts`
Open `src/templates/index.ts`, import your JSON definition, and add it to the `BUILTIN_TEMPLATES` array:

```ts
import myCustomCardJson from "./definitions/my-custom-card.json";
import type { OgTemplate } from "./types";

export const BUILTIN_TEMPLATES: OgTemplate[] = [
  // ... existing templates
  myCustomCardJson as OgTemplate,
];
```

### Step 3: Test Live in Your Browser
Start the local development server:
```bash
npm run dev
```
Open `http://localhost:5173` and click the **Templates** panel. Your new template will appear under its category tab (`Gradient`) with a live 1200×630 Canvas preview!

---

## 🤖 Using AI Assistants to Generate Templates

Because Shareframe templates are declarative JSON files with predictable layout rules, **AI coding assistants** (such as Antigravity, Cursor, Claude, or GitHub Copilot) can design and register new templates for you in seconds.

### 1. The Built-in AI Skill (`generate-templates`)
Shareframe includes an AI Skill instruction file located at `.agents/skills/generate-templates/SKILL.md`. This file teaches AI agents:
- The exact TypeScript types (`OgTemplate`, `TemplateState`).
- The 1200×630 coordinate system and typography rules.
- How to format gradient backgrounds, split-column product cards, and e-commerce badge overlays.
- How to automatically register the generated file in `src/templates/index.ts`.

### 2. Ready-to-Use AI Prompt Examples

You can copy and paste prompts like the following directly to your AI assistant:

#### Example 1: Podcast Episode Release Card
> **Prompt:**  
> *"Create a new Shareframe Open Graph template in `src/templates/definitions/podcast-episode-card.json` for a podcast episode release. Use a dark violet radial gradient background, centered Space Grotesk typography, an overlay image card on the right for the episode cover artwork, and a badge for 'EPISODE 42'. Register the template in `src/templates/index.ts`."*

#### Example 2: Luxury E-Commerce Product Card
> **Prompt:**  
> *"Generate an e-commerce watch product template JSON for Shareframe in `src/templates/definitions/luxury-watch.json`. Use a sleek dark slate background (`#09090b`), Plus Jakarta Sans for the title, a primary price of '$499', an original strikethrough price of '$599', a 4.9-star rating with '312 reviews', and a right-aligned product image card. Add it to `src/templates/index.ts`."*

#### Example 3: Minimalist Technical Essay Card
> **Prompt:**  
> *"Add a clean minimal editorial template for long-form blog posts in `src/templates/definitions/minimal-essay.json`. Use an off-white stone background (`#f5f5f4`), high-contrast dark text (`#1c1917`), a category of 'Solid', and register it in `src/templates/index.ts`."*

---

## 📋 Template Property Reference

### Top-Level `OgTemplate` Object
| Property | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Yes** | Unique kebab-case ID matching the filename (`src/templates/definitions/<id>.json`). |
| `name` | `string` | **Yes** | Display title shown on the template card in the UI selector. |
| `description` | `string` | **Yes** | Description of layout, style, and recommended use case. |
| `category` | `string` | Optional | Tab category for filtering (`"With Image"`, `"Gradient"`, `"E-Commerce"`, `"Solid"`). |
| `badge` | `string` | Optional | Tag badge shown in the corner of the card (`"Hero"`, `"Product"`, `"Minimal"`, `"Blog"`, etc.). |
| `state` | `TemplateState` | **Yes** | Canvas state object defining layout, typography, backgrounds, and extra overlays. |

---

### `TemplateState` Reference Table

```json
"state": {
  "background": { ... },
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

| Component | Property | Type | Default / Range | Description |
| :--- | :--- | :--- | :--- | :--- |
| **`background`** | `type` | `"solid" \| "gradient"` | Required | Background type discriminator. |
| | `color` | `string` | `"#09090b"` | Hex color string when `type: "solid"`. |
| | `style` | `"linear" \| "radial"` | `"linear"` | Gradient rendering style when `type: "gradient"`. |
| | `angle` | `number` | `135` | Angle in degrees (`0`–`360`) for linear gradients. |
| | `cx` / `cy` | `number` | `0.5` | Center coordinates (`0.0`–`1.0`) for radial gradients. |
| | `radius` | `"farthest-corner" \| number` | `"farthest-corner"` | Radial radius on the 1200×630 canvas. |
| | `colors` | `string[]` | Required | Array of hex color strings for gradients. |
| **`logo`** | `y` | `number` | `0.0`–`1.0` | Vertical position (`0.1` = top header, `0.92` = bottom footer). |
| | `scale` | `number` | `0.3`–`1.5` | Scale multiplier (`1.0` = 100%, `0.55` = compact mark). |
| | `alignment` | `"left" \| "center" \| "right"` | `"center"` | Horizontal positioning in the safe canvas area. |
| | `src` | `string \| null` | `null` | Set to `null` to preserve the user's uploaded logo when switching templates. |
| **`title` & `description`** | `content` | `string` | Required | Default text string populated when applied. |
| | `fontFamily` | `string` | `"Inter"`, `"Space Grotesk"`, etc. | Font family name (must be loaded system/Google font). |
| | `fontSize` | `number` | `12`–`120` | Font size in canvas pixels (recommended: `48`–`68` for titles). |
| | `width` | `number` | `10`–`100` | Max line-wrapping width percentage (`100` = full width, `80` = padded). |
| | `fontWeight` | `number` | `400`–`800` | Numeric font weight (`400` = normal, `700` = bold). |
| | `color` | `string` | `"#ffffff"` | Hex CSS color string for text. |
| | `alignment` | `"left" \| "center" \| "right"` | `"center"` | Horizontal text alignment. |
| | `yOffset` | `number` | `-200` to `200` | Fine-tuned vertical adjustment in canvas pixels. |
| **`image`** | `enabled` | `boolean` | `true` | Whether an overlay image card is active. |
| | `src` | `string \| null` | URL / SVG data URI | Default image source URL or SVG data URI. |
| | `position` | `"bottom" \| "right" \| "left"` | `"bottom"` | Layout mode (`"bottom"` card vs `"right"` / `"left"` split). |
| | `scale` | `number` | `0.4`–`1.2` | Scale multiplier for the image slot. |
| | `borderRadius` | `number` | `0`–`48` | Corner radius in canvas pixels. |
| | `shadow` | `boolean` | `true` | Enables a Canvas 2D drop shadow around the card frame. |
| | `shadowBlur` | `number` | `0`–`64` | Blur intensity radius for the shadow. |
| **`badge`** | `text` | `string` | `"BESTSELLER"` | Text string inside the promotional pill badge. |
| | `color` | `string` | `"#ffffff"` | Badge text color hex string. |
| | `background` | `string` | `"#10b981"` | Badge pill background color hex string. |
| **`price` & `originalPrice`** | `text` | `string` | `"$199"` | Display price string. |
| | `color` | `string` | `"#10b981"` | Text hex color string. |
| | `fontSize` | `number` | `28` / `20` | Font size in canvas pixels. |
| **`rating`** | `value` | `number` | `0.0`–`5.0` | Numeric star rating (supports halves like `4.5`). |
| | `color` | `string` | `"#f59e0b"` | Star fill color hex string. |
| | `reviewCount` | `string` | `"256 reviews"` | Text displayed after the star icons. |

---

## 🎨 Design Best Practices

1. **Fixed 1200×630 Resolution**: Keep in mind that all font sizes, offsets, and corner radii are calculated directly for the standard 1200×630 Open Graph canvas size.
2. **Text Wrapping Width (`width`)**:
   - In **Split Layouts** (`image.position: "left"` or `"right"`), use `width: 100` so text cleanly fills its half of the canvas.
   - In **Centered Layouts**, use `width: 75` to `85` to ensure comfortable margins on both sides.
3. **Logo Persistence**:
   - Always set `"src": null` inside `logo` unless your template is specifically bundling an SVG watermark. Setting `null` ensures any custom logo uploaded by the user is preserved when switching between templates.
4. **Contrast & Color Harmony**:
   - For dark templates, use high-contrast primary text (`#f8fafc` or `#ffffff`) and softer muted colors (`#94a3b8` or `#c7d2fe`) for descriptions.
   - For e-commerce product cards, use vibrant accent colors for badges (`#6366f1` or `#10b981`) and star ratings (`#f59e0b`).
