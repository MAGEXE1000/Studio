# Chordex Studio — Design System

This document specifies typography, dark mode color configurations, spacing grids, component templates, and safe-area guidelines.

---

## 1. Dark Mode Color Configurations (Aspirational Style Tokens)

The design system uses a dark mode palette. While color variables are not currently registered as global CSS custom properties, the following styling values are applied inline across components:

| Aspirational Token | Usage | CSS Hex Value | Purpose |
|---|---|---|---|
| **`--bg-base`** | App background | `#0e0e0e` | Solid near-black base |
| **`--bg-surface`** | Component cards | `rgba(25, 26, 26, 0.6)` | Translucent gray backing |
| **`--border-subtle`**| Element borders | `rgba(72, 72, 72, 0.15)` | Low-contrast containment outline |
| **`--text-primary`** | Main headers | `#e7e5e4` | High-contrast warm off-white |
| **`--text-secondary`**| Subtitles / details| `#acabaa` | Muted neutral gray |
| **`--primary`** | Accent / interactive| `#007aff` | Sleek Material 3 Blue |
| **`--warning`** | Warnings / alerts | `#f59e0b` | Soft amber warning gold |
| **`--error`** | Error messages | `#ee7d77` | Warm pastel red |

Source:
* `packages/ui-shared/src/components/DevToolsDashboard.tsx`
* `packages/ui-shared/src/components/AccountCard.tsx`

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
