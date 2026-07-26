# AGENTS.md — OGSnap

Guidance for AI coding agents working in this repository.

## Project

**OGSnap** is a fast browser tool that generates clean Open Graph images (1200×630) with a logo, title, and description on solid backgrounds.

**Success metric:** A user can create and download a usable OG image in under 60 seconds.

## Product scope

### In scope (v1)

- Solid background color presets + custom color picker
- Logo upload (PNG preferred) with position and scale controls
- Title and description: independent font family, size, color, weight
- Live canvas preview at **1200×630**
- Export as **PNG**, **JPG**, and **WebP**
- Dark/light theme via Astryx theming
- Responsive controls layout

### Out of scope (v1)

- Gradients, patterns, multiple logos
- Text effects, template library
- User accounts / cloud save

Prefer shipping a tight, polished v1 over expanding scope.

## Tech stack

| Layer | Choice |
| --- | --- |
| App framework | Vite + React |
| UI | Astryx (`@astryxdesign/core`, `@astryxdesign/theme-neutral`, Astryx CLI) |
| Rendering / export | Canvas API (`canvas.toBlob` for downloads) |
| Fonts | System fonts + Google Fonts |

Do not introduce alternate UI kits, heavy canvas libraries, or backend services unless the user explicitly asks.

## Documentation

| Path | Purpose |
| --- | --- |
| `docs/PRD.md` | Product requirements and success criteria |
| `docs/TODO.md` | Implementation checklist (scaffold → polish) |
| `AGENTS.md` | This file — agent/project conventions |

Keep these docs accurate when product or stack decisions change.

## Architecture principles

1. **Single-source editor state** — One React state (or small set of related state) drives both the controls and the canvas. Changing any control must trigger a live redraw.
2. **Canvas is the source of truth for pixels** — Preview and export must use the same drawing path so what you see is what you get.
3. **Fixed OG size** — Always render at 1200×630. CSS may scale the preview for layout; export must be full resolution.
4. **Astryx for chrome, Canvas for the image** — Use Astryx for app shell, controls, theme. Use Canvas API only for the OG composition surface and export.
5. **Client-only** — No server, auth, or persistence in v1. Everything runs in the browser.

## Suggested app shape (once scaffolded)

```
src/
  components/     # Controls, layout, export buttons
  canvas/         # Draw + export helpers (1200×630)
  state/          # Editor state types and defaults
  App.tsx
  main.tsx
```

Adjust freely if a simpler flat structure works better early on; keep canvas drawing logic separate from form controls.

## Implementation order

Follow `docs/TODO.md` roughly in order:

1. Scaffold Vite + React
2. Install Astryx + `npx astryx init`
3. App shell / layout
4. Canvas + live redraw
5. Background, logo, title/description controls
6. Fonts
7. Export (PNG / JPG / WebP)
8. Theme + polish + cross-browser smoke test

## Coding conventions

- Prefer TypeScript once the Vite React scaffold is in place.
- Keep components small; isolate pure drawing/export functions for easy testing.
- Avoid premature abstraction — one screen app; don’t invent a design system on top of Astryx.
- Match existing naming and file layout once the project is scaffolded.
- Do not add dependencies without a clear need (especially for canvas drawing — the native API is enough for v1).

## Commands (after scaffold)

Typical Vite/React workflow (confirm against `package.json` after scaffold):

```bash
npm install
npm run dev
npm run build
npm run preview
```

Astryx setup is expected to use:

```bash
npx astryx init
```

## What not to do

- Do not add gradients, multi-logo, templates, or accounts without an explicit product decision.
- Do not replace Canvas with a screenshot-of-DOM approach unless justified; stick to Canvas API for WYSIWYG export.
- Do not commit secrets or API keys (none required for v1).
- Do not expand `docs/` with unsolicited markdown unless asked.

## Working style for agents

- Read `docs/PRD.md` and `docs/TODO.md` before large changes.
- Prefer minimal diffs that complete the next TODO item.
- When finishing a feature, update `docs/TODO.md` checkboxes if they clearly match the work done.
- Ask before destructive git operations, force-pushes, or changing shared remote state.

<!-- ASTRYX:START -->
Astryx v0.1.8 · 153 components
CLI: run every command as `npx astryx <cmd>` (shown below as `astryx ...`).

SETUP (once, in your app entry e.g. main.tsx) — without these, components render unstyled:
  import "@astryxdesign/core/reset.css";
  import "@astryxdesign/core/astryx.css";

WORKFLOW — discover, don't guess. Before writing UI:
1. `astryx build "<idea>"` — START HERE: returns a kit (closest [page] + [block]s + [component]s). No args = full playbook.
2. `astryx template <name> [--skeleton]` — scaffold the [page]/[block]s it named, or study their layout. Templates are reference code.
3. `astryx component <Name>` — props + examples for every component you use.

RULES:
- No <div> — components do all layout/spacing. Full page → AppShell; sidebar nav → SideNav.
- Frame first: pick the shell (AppShell / Layout+LayoutPanel) and budget regions in px BEFORE writing content (`astryx docs layout`).
- Dense data = rows (Table, List/Item) edge-to-edge — never Card-wrapped list items. Card = dashboard widgets, galleries, settings groups only.
- Status → StatusDot/Token; Badge only for counts and enumerated states, never decoration.
- Custom styling: component props first; else style/className with tokens — var(--color-*|--spacing-*|--radius-*). No raw hex/px. (No StyleX/Tailwind compiler here — don't use xstyle/utility classes.)
- Tokens for every value (`astryx docs tokens`). Brand/accent via `astryx theme` — never override --color-* in :root.
- SELF-CHECK before you finish: re-read the file and replace any raw <div>/<span> layout, imported .css/@apply, or hardcoded value (#hex, 16px) with the component or a token (var(--color-*|--spacing-*|…)). If unsure a component/prop exists, run `astryx component <Name>` / `astryx search "<thing>"`; don't hand-roll CSS.

MORE CLI:
  search "<query>"   find any component / hook / doc / template / block
  component --list   153 components by category
  template --list    page + block recipes
  docs <topic>       color, elevation, icons, illustrations, internationalization, layout, migration, motion, principles, shape, spacing, styling, theme, tokens, typography
  swizzle <Name>     eject component source for deep customization
  upgrade --apply    run after any @astryxdesign/core bump
<!-- ASTRYX:END -->
