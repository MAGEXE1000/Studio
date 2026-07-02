# Reusable Knowledge — Workspace Build Commands

This document lists the build targets, package filters, and compilation commands.

---

## 1. Local Monorepo Build Commands
The monorepo enforces `pnpm` workspaces for package management:

- **Build All Assets**:
  ```bash
  pnpm build
  ```
- **Web App Compilation**:
  ```bash
  pnpm run build:web
  ```
- **Android Web Asset Build**:
  ```bash
  pnpm run build:android:web
  ```
- **Capacitor Directory Synchronization**:
  ```bash
  npx cap sync android
  ```

Source:
* [package.json](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/package.json#L7-L10)

---

## 2. Dev Environment Caching
- **Dev Version Check Override**: The workspace hook `predev` runs version sync with the `--preserve-newer` flag. This allows local modifications to `version.json` (such as injecting high changelog versions) to test banner morph UI animations without restarts overwriting them.
- **Production Builds**: The `prebuild` hook omits `--preserve-newer` to overwrite overrides.

Source:
* [AGENTS.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/AGENTS.md#L70-L75)
