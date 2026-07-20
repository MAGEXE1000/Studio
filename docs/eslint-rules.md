# Livex Custom ESLint Rules

As part of the Architecture Governance Foundation, we have introduced a custom ESLint plugin `eslint-plugin-livex` located in `tools/eslint-plugin-livex`.

This plugin contains rules designed specifically to prevent architectural drift in the Livex monorepo.

## Rules Inventory

### `livex/no-hardcoded-colors`

**Purpose:** Prevents hardcoded hex, rgb, and hsl strings in style props or anywhere in JSX props (e.g., `color`, `backgroundColor`, `fill`).
**Why:** Livex uses a unified theme system with CSS custom properties (`--c-*`). Hardcoding colors prevents components from responding to theme changes (light/dark mode) and bypasses the design system's token constraints.
**Current Status:** Set to `warn` initially because there are 270+ existing violations (especially in Drumex and Chordex).
**How to fix:** Replace the hex string with a design token CSS variable, e.g., `var(--c-bg-primary)`.

### `livex/no-inline-springs`

**Purpose:** Bans `{ stiffness, damping, mass }` literals.
**Why:** Livex has one canonical motion system (`SpringPresets` from `packages/tokens`). Inline spring configs cause the UI to feel inconsistent and fragmented.
**Current Status:** Set to `warn` because there are 17+ inline spring configs that need to be migrated to `SpringPresets`.
**How to fix:** Import `SpringPresets` from `packages/tokens` (once the tokens package is fully established) and use `SpringPresets.soft` etc.

### `livex/no-stores-outside-core`

**Purpose:** Enforces that `zustand` stores are only created inside `packages/core`.
**Why:** All global state in Livex must be centrally managed in the core kernel to prevent circular dependencies and state fragmentation (e.g. `useGroovexStore` currently violating this).
**Current Status:** Set to `warn` to allow incremental migration of stores like `useGroovexStore` to `packages/core`.

### `livex/no-cross-feature-imports`

**Purpose:** Prevents a feature module from directly importing another feature module.
**Why:** Features must remain decoupled so they can be lazy-loaded, independently tested, and potentially split into separate deployment units. Features should only communicate through `packages/core` stores and services.
**Current Status:** Set to `error`.

### `livex/no-raw-ui-primitives`

**Purpose:** Warns on usage of raw HTML tags like `<button>`, `<input>`, or `<select>` inside feature modules.
**Why:** All interactive elements should use the `packages/ui` design system components (e.g., `<Button>`, `<SearchBar>`) to ensure consistent styling, accessibility, and behavior.
**Current Status:** Set to `warn` to allow incremental adoption of the unified `StudioDesignSystem`.

## Migration Strategy

These rules are currently configured as `warn` in `eslint.config.mjs` to ensure CI builds continue to pass. In the next phases of the unification roadmap, we will:

1. Fix the underlying code violations.
2. Upgrade the rule severity to `error`.
