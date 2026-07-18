# Studio Architecture Documentation

> **Auto-generated**: 2026-07-17 · **Version**: 4.0.84 · **Platform**: Android + Web

This directory contains the complete engineering architecture knowledge base for the Studio repository. It serves as the project's source of truth for future development.

## Contents

| Document | Description |
|----------|-------------|
| [overview.md](overview.md) | Project structure, workspace layout, build flow, entry points |
| [navigation.md](navigation.md) | Custom navigation system, route model, transitions, gestures |
| [shared-ui.md](shared-ui.md) | Shared components, design system, animation framework |
| [motion-system.md](motion-system.md) | Centralized Material 3 Motion System, durations, easings, helpers |
| [android.md](android.md) | Capacitor integration, native plugins, permissions, lifecycle |
| [firebase.md](firebase.md) | Authentication, Firestore, Storage, Hosting, security rules |
| [updater.md](updater.md) | OTA update pipeline, state machine, APK installation flow |
| [chordex.md](chordex.md) | Chord Explorer module — library, diagrams, progressions |
| [drumex.md](drumex.md) | Drum Machine module — pattern editor, sequencer, kits |
| [stagex.md](stagex.md) | Stage module — performance view, iframe integration |
| [groovex.md](groovex.md) | Groove Player module — stem player, library, preferences |
| [vocalex.md](vocalex.md) | Vocal Training module — pitch detection, recording, coach |
| [performance.md](performance.md) | Rendering, animation, memoization, lazy loading |
| [release-pipeline.md](release-pipeline.md) | CI/CD, GitHub Actions, versioning, deployment |
| [dependency-graph.md](dependency-graph.md) | Package relationships, service dependencies |
| [technical-debt.md](technical-debt.md) | Large files, tight coupling, refactor opportunities |
| [future-maintenance.md](future-maintenance.md) | Coding conventions, isolation rules, recommendations |

## Quick Start for New Engineers

1. Read [overview.md](overview.md) to understand the monorepo layout and build system
2. Read [dependency-graph.md](dependency-graph.md) to understand package relationships
3. Read [navigation.md](navigation.md) to understand routing (there is no React Router)
4. Read the module doc for your feature area (chordex, drumex, etc.)
5. Read [android.md](android.md) if working on native integrations
6. Read [technical-debt.md](technical-debt.md) before large refactors

## Refreshing Documentation

A helper script is provided to validate and refresh this documentation:

```bash
node docs/architecture/scripts/refresh-docs.mjs
```

## Conventions

- All diagrams use **Mermaid** syntax
- File references use relative paths from the repository root
- Documentation reflects the **current implementation** — nothing is invented
- When uncertain, the source code was inspected before documenting
