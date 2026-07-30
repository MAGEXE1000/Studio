# Domain Documentation & Architecture Layout

This repository uses a multi-package monorepo architecture indexed by `ARCHITECTURE_INDEX.md` and governed by `AGENTS.md`.

## Context & Architecture Structure

- **Primary Architecture Index**: `ARCHITECTURE_INDEX.md` at repo root
- **Agent Guidelines & Governance**: `AGENTS.md` at repo root
- **Single Source of Truth Versions**: `packages/studio-core/src/lib/startup/appVersion.ts`
- **Component Packages**: `packages/studio-core`, `packages/ui-shared`, `packages/ui-web`, `apps/studio-web`, `apps/studio-android`
