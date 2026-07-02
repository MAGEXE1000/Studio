# Reusable Knowledge — Import Rules

This document covers workspace compilation boundaries.

---

## Import Separation
- Code inside `packages/studio-core` must not import native Capacitor plugins directly without checks (`isNative()`).
- Verify imports conform to architectural scopes via `pnpm lint:imports`.

Source:
* [package.json](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/package.json#L18)
