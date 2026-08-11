# Name

**Shareframe**

# Product Requirements Document (PRD)

**Goal**  
Fast browser tool to generate clean Open Graph images (1200×630) with logos, typography, e-commerce cards, badges, prices, ratings, and custom overlay shapes on solid or preset gradient backgrounds. Built with Vite + React + shadcn/ui.

**Core Features**

- Solid background color presets + HSL/HEX color picker
- Curated linear and radial gradient background presets
- Declarative `elements: CanvasElement[]` state model with normalization
- Single-source JSON template system with 13+ built-in templates auto-registered via Vite `import.meta.glob`
- Logo upload (PNG, SVG, WebP) with position, scaling, and alignment controls
- Title & Description: independent font family, size, color, weight, width, and vertical offsets
- Overlay image card support with custom scaling, corner radius, and drop shadow
- E-Commerce elements: promotional pill badges, price displays, strikethrough original prices, and star ratings
- Live Canvas 2D preview (1200×630) with web worker rendering
- Live social preview cards for Twitter/X, LinkedIn, and Facebook
- Persistent local storage with undo/redo state history
- URL metadata import engine (extracting title, description, logo, theme color)
- Batch OG image generator for multi-page export
- Export: PNG, JPG, WebP through download manager and Clipboard API copy
- shadcn/ui components + Tailwind CSS studio theme

**Out of Scope**

- Multi-page video export / animated GIFs
- User accounts / cloud database save

**Tech Stack**

- Vite + React + TypeScript
- shadcn/ui (Radix base) + Tailwind CSS
- Canvas 2D for live preview and composition
- OffscreenCanvas worker for responsive preview rendering and export
- Explicit opaque sRGB output for preview/export color fidelity
- Vite `import.meta.glob` for zero-boilerplate JSON template auto-registration
- LocalStorage for client-side state persistence and history stack

**Success**  
Create and download a usable OG image in under 60 seconds.
