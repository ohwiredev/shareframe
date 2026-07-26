# Name

**OGSnap**

# Product Requirements Document (PRD)

**Goal**  
Fast browser tool to generate clean Open Graph images (1200×630) with logo + title + description on solid backgrounds. Built with Vite + React + Astryx.

**Core Features**

- Solid background color presets + custom color picker
- Logo upload (PNG preferred) with position & scale controls
- Title & Description: independent font family, size, color, weight
- Live canvas preview (1200×630)
- Export: PNG, JPG, WebP
- Astryx components + theming (dark/light)

**Out of Scope (v1)**

- Gradients, patterns, multiple logos, text effects, templates library, accounts

**Tech Stack**

- Vite + React
- Astryx (`@astryxdesign/core` + theme-neutral)
- Canvas API for rendering & export

**Success**  
Create and download a usable OG image in under 60 seconds.
