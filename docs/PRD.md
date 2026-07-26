# Name

**Shareframe**

# Product Requirements Document (PRD)

**Goal**  
Fast browser tool to generate clean Open Graph images (1200×630) with logo + title + description on solid or preset gradient backgrounds. Built with Vite + React + shadcn/ui.

**Core Features**

- Solid background color presets + custom color picker
- Curated gradient background presets (no custom gradient editor)
- Logo upload (PNG preferred) with position & scale controls
- Title & Description: independent font family, size, color, weight
- Live Canvas 2D preview (1200×630)
- Export: PNG, JPG, WebP through the browser's download manager
- shadcn/ui components + Tailwind CSS theming (dark/light)

**Out of Scope (v1)**

- Custom gradients, patterns, multiple logos, text effects, templates library, accounts

**Tech Stack**

- Vite + React
- shadcn/ui (Radix base) + Tailwind CSS
- Canvas 2D for the live preview and composition
- OffscreenCanvas worker for responsive preview rendering and browser-native export
- Explicit opaque sRGB output for preview/export color fidelity

**Success**  
Create and download a usable OG image in under 60 seconds.
