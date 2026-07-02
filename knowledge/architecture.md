# Reusable Knowledge — Workspace Architecture

This document describes the monorepo package layout and import boundaries.

---

## 1. Monorepo Separation Guidelines
- **Android APK**: Resides in `apps/studio-android` and `packages/ui-android`. Modifies Java files, Capacitor plugins, or touch-focused UI components.
- **Web App**: Resides in `apps/studio-web` and `packages/ui-web`. Uses desktop landing layouts.
- **Core Shared Packages**: Core libraries reside in `packages/studio-core` and platform-neutral elements reside in `packages/ui-shared`.

Source:
* [coding_standards.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/coding_standards.md#L44-L52)

---

## 2. Import Boundaries Verification
Import configurations are validated using a custom check script:
- **Core Separation**: Code inside `packages/studio-core` is strictly forbidden from importing native Capacitor plugins directly without checks (`isNative()`).
- **Linter Rule**: Run `pnpm lint:imports` to verify imports conform to modular boundaries.

Source:
* [package.json](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/package.json#L18)
