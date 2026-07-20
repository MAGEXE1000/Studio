# Studio Architecture Documentation

> **Updated**: 2026-07-20 · **Version**: 4.2.4 · **Platform**: Android + Web

This directory contains the complete engineering architecture knowledge base for the Livex Studio repository. It is the project's **permanent source of truth** for current architecture. It must always represent the actual codebase — never aspirational or outdated.

## Rules

- **Before implementing any major feature**, read the relevant architecture documents first.
- **When architecture changes**, update these documents immediately alongside the code.
- **If documentation conflicts with implementation**, identify the inconsistency and update whichever is incorrect.
- **This documentation is permanent.** It exists to reduce architectural drift, prevent duplicated implementations, and keep every future conversation aligned.

## Contents

### Core Systems

| Document | Description |
|----------|-------------|
| [overview.md](overview.md) | Project structure, workspace layout, build flow, entry points |
| [apps.md](apps.md) | Sub-application registry, responsibilities, root screens, shared infrastructure |
| [navigation.md](navigation.md) | Custom navigation system, route model, history stack, gestures |
| [transition-engine.md](transition-engine.md) | Application transition state machine, lifecycle, safety watchdogs |
| [bottom-navigation.md](bottom-navigation.md) | Bottom nav bar, motion states, item registration, scroll-hide |
| [app-switcher.md](app-switcher.md) | App switching overlay, cross-store coordination, user flow |
| [notification-service.md](notification-service.md) | In-app notification store, event publishers, persistence |
| [theme-engine.md](theme-engine.md) | Theme transition engine, View Transitions API, chromatic bloom |
| [design-system.md](design-system.md) | Design tokens, CSS properties, component library, platform adaptation |
| [motion-system.md](motion-system.md) | Material 3 motion tokens, springs, easings, transition helpers |
| [sync-engine.md](sync-engine.md) | Cloud sync state machine, Firestore, per-app strategy, safety guarantees |
| [shared-ui.md](shared-ui.md) | Shared UI components, layout scaffolds, animation framework |
| [performance.md](performance.md) | Startup pipeline, rendering, animation, memory, profiling |

### Platform & Infrastructure

| Document | Description |
|----------|-------------|
| [android.md](android.md) | Capacitor integration, native plugins, permissions, lifecycle |
| [firebase.md](firebase.md) | Authentication, Firestore, Storage, Hosting, security rules |
| [updater.md](updater.md) | OTA update pipeline, state machine, APK installation flow |
| [release-pipeline.md](release-pipeline.md) | CI/CD, GitHub Actions, versioning, deployment |
| [platform-separation.md](platform-separation.md) | Web vs Android file ownership, build boundaries |
| [dependency-graph.md](dependency-graph.md) | Package relationships, service dependencies |

### Sub-Application Modules

| Document | Description |
|----------|-------------|
| [chordex.md](chordex.md) | Chord Explorer — library, diagrams, progressions |
| [drumex.md](drumex.md) | Drum Machine — pattern editor, sequencer, kits |
| [stagex.md](stagex.md) | Stage — performance view, iframe integration |
| [groovex.md](groovex.md) | Groove Player — stem player, library, preferences |
| [vocalex.md](vocalex.md) | Vocal Training — pitch detection, recording, coach |

### Maintenance

| Document | Description |
|----------|-------------|
| [technical-debt.md](technical-debt.md) | Large files, tight coupling, refactor opportunities |
| [future-maintenance.md](future-maintenance.md) | Coding conventions, isolation rules, recommendations |
| [migration_map.md](migration_map.md) | Migration plans and history |

## Quick Start for New Engineers

1. Read [overview.md](overview.md) to understand the monorepo layout and build system
2. Read [apps.md](apps.md) to understand the 6 sub-applications and shared infrastructure
3. Read [navigation.md](navigation.md) to understand routing (there is no React Router)
4. Read [transition-engine.md](transition-engine.md) to understand app switching
5. Read the module doc for your feature area (chordex, drumex, stagex, groovex, vocalex)
6. Read [technical-debt.md](technical-debt.md) before large refactors
7. Read [../bugs/README.md](../bugs/README.md) before investigating any bugs

## Refreshing Documentation

A helper script is provided to validate and refresh this documentation:

```bash
node docs/architecture/scripts/refresh-docs.mjs
```

## Conventions

- All diagrams use **Mermaid** syntax
- File references use relative paths from the repository root or `file:///` absolute links
- Documentation reflects the **current implementation** — nothing is invented or aspirational
- When uncertain, the source code is inspected before documenting
- Each document follows the standard template: Purpose, Responsibilities, Architecture, Dependencies, Data Flow, Lifecycle, Public API, Design Decisions, Known Constraints, Future Improvements
