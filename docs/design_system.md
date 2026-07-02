# Chordex Studio — Design System

This document specifies typography, dark mode color configurations, spacing grids, component templates, and safe-area guidelines.

---

## 1. Dark Mode Color Configurations (Registered Theme Tokens)

The design system uses a dark mode palette registered globally as CSS custom properties under the `@theme` block in the workspace stylesheets. These can be transitioned natively and dynamically.

### A. Core Tailwind Theme Color Variables
These variables map to the Material 3 design system components:

| Variable | Default Value | Purpose |
|---|---|---|
| `--color-surface` | `var(--app-bg)` | App canvas background color |
| `--color-surface-container` | `var(--app-surface)` | Card and panel wrapper background |
| `--color-on-surface` | `#e7e5e4` | High-contrast text on cards |
| `--color-on-surface-variant` | `#acabaa` | Muted secondary label text |
| `--color-primary` | `#c6c6c7` | Main call-to-actions borders and text |
| `--color-tertiary-container`| `var(--studio-accent-to)` | Theme accent background (e.g. blue) |
| `--color-error` | `#ee7d77` | Error tags and validation states |

### B. Typed Custom Properties (Registered via `@property`)
These custom properties enforce a syntax check so they can be smoothly animated by CSS transition engines:

*   **`--app-bg`**: Initial value `#0e0e0e` (base background).
*   **`--app-surface-lowest`**: Initial value `#000000` (black).
*   **`--app-surface`**: Initial value `#191a1a` (default card container).
*   **`--app-surface-highest`**: Initial value `#252626` (high-contrast header/active item).
*   **`--c-text-primary`**: Initial value `#e7e5e4` (off-white).
*   **`--c-text-secondary`**: Initial value `#acabaa` (gray).

### C. Radius & Font Tokens
- **Font Headline / Sans**: `"Manrope", sans-serif`
- **Font Label**: `"Inter", sans-serif`
- **Standard Radii**: `--radius-sm` (0.25rem), `--radius-md` (0.5rem), `--radius-lg` (0.75rem), `--radius-xl` (1rem), `--radius-2xl` (1.5rem), `--radius-3xl` (2rem), `--radius-full` (9999px).

Source:
* [index.css](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/apps/studio-android/src/index.css#L39-L121)
* [index.css](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/apps/studio-web/src/index.css#L39-L77)

---

## 2. Typography

We use Google Fonts to establish a clean interface hierarchy:

* **Primary Copy (Inter)**: Applied to general body copy, tooltips, list elements, and console views to optimize readability.
  * Standard: `Inter Regular 400`
  * Strong: `Inter Bold 700`
* **Headings & Metrics (Manrope)**: Applied to titles, status counters, and stats grids.
  * Weight: `Manrope 700` or `Manrope 800`
  * Font-Family fallback: `'Manrope', system-ui, sans-serif`

Source:
* `packages/ui-shared/package.json` (depends on `@fontsource/inter` and `@fontsource/manrope`)
* `packages/ui-shared/src/components/DevToolsDashboard.tsx`

---

## 3. Component Templates & Guidelines

### Bento Cards
Cards use dynamic styling with backdrop blurs and subtle outlines:
```css
background: rgba(25, 26, 26, 0.6);
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
border: 1px solid rgba(72, 72, 72, 0.15);
border-radius: 16px;
padding: 16px 20px;
```

### Action Buttons
Buttons feature transition states and scaling feedback:
* **Default Accent State**: `background: #007aff; color: #fff;`
* **Subtle Secondary State**: `background: rgba(255,255,255,0.05); color: #e7e5e4; border: 1px solid rgba(72,72,72,0.15);`
* **Hover State**: Increased brightness (`hover:brightness-110` or `hover:bg-white/10`).
* **Active Press State**: Slight scale transform transition (`active:scale-95`).

Source:
* `packages/ui-shared/src/components/DevToolsDashboard.tsx`

---

## 4. Spacing, Safe Areas, & Layouts

* **Spacing Grid**: Standard sizing intervals match increments of `4px` (e.g. `4px`, `8px`, `12px`, `16px`, `20px`, `24px`).
* **Mobile-First Principles**: Align main interactive targets to standard finger tap zones (minimum `44px` height and width).
* **Safe Areas**: Scrollable views must include a bottom padding offset to prevent buttons from overlapping with native OS bars:
  * Regular pages: `padding-bottom: calc(env(safe-area-inset-bottom) + 20px)`
  * Overlay dashboard views: `padding-bottom: calc(var(--content-bottom-pad, 96px) + 80px)`

Source:
* `packages/ui-shared/src/components/DevToolsDashboard.tsx`
