# Technical Debt

This document catalogs known technical debt, large files, tight coupling, and refactoring opportunities discovered during the architecture analysis.

## Critical: Oversized Files

These files significantly exceed reasonable single-file complexity limits and are the most urgent candidates for decomposition.

| File | Size | Lines | Module |
|------|------|-------|--------|
| `DrumEditor.tsx` | 363 KB | 5,603 | drumex |
| `StudioHub.tsx` | 262 KB | ~4,000+ | hub |
| `AccountCard.tsx` | 249 KB | ~4,000+ | cards |
| `SongsPanel.tsx` | 195 KB | ~3,000+ | chordex |
| `DevToolsDashboard.tsx` | 185 KB | ~3,000+ | devtools |
| `StageCorePanel.tsx` (Android) | 136 KB | ~2,600 | stagex |
| `StageCorePanel.tsx` (Shared) | 116 KB | ~2,600 | stagex |
| `progressions.ts` | 111 KB | — | data |
| `LibraryPanel.tsx` | 94 KB | ~1,800 | chordex |
| `UpdateIndicator.tsx` | 87 KB | ~1,700 | update |
| `AppInstallerPlugin.java` | 85.8 KB | 1,860 | android native |
| `pipeline.ts` | 75 KB | 1,695 | updater |
| `faqConstants.tsx` | 70 KB | — | hub |
| `ChordPanel.tsx` | 65 KB | 1,370 | chordex |
| `LabPanel.tsx` | 57 KB | ~1,100 | vocalex |
| `diagnostics.ts` | 52.6 KB | 1,483 | updater |
| `StageCorePanel.tsx` (Shared) | 50 KB | — | feature |
| `GroovexPlayer.tsx` | 46 KB | — | groovex |
| `data/chords.ts` | 48.8 KB | — | data |
| `stateMachine.ts` | 41 KB | 1,033 | updater |

> **Impact**: Large files increase parse/compile time, make code review difficult, cause merge conflicts, and hinder onboarding.

## High: Duplicated Implementations

### StageCorePanel Duplication

Two separate implementations of `StageCorePanel`:

| Location | Size |
|----------|------|
| `ui-shared/src/features/stagex/pages/StageCorePanel.tsx` | 116 KB |
| `ui-android/src/components/StageCorePanel.tsx` | 136 KB |

**Recommendation**: Extract shared logic into a base component or hooks, with platform-specific wrappers for Android-only features (screen orientation, native bridge).

### Proxy File Proliferation

~46 proxy re-export files in `ui-shared/src/components/` and ~23 proxy files in `vocalex/` and `groovex/` top-level directories. While this provides cleaner imports, it adds maintenance overhead.

**Recommendation**: Consider barrel exports with proper `index.ts` files or TypeScript path aliases.

## High: Monolithic Stores

### useChordStore (881 lines, 33 KB)

This store has grown to manage concerns that should be separate:

| Concern | Should Be |
|---------|-----------|
| Chord selection & usage | Chord store |
| App-wide settings (~50 fields) | Dedicated settings store |
| Favorites & recent chords | Chord store |
| Progressions CRUD | Dedicated progressions store |
| Song presets CRUD | Dedicated songs store |
| Custom chords CRUD | Chord store |
| Session restore | Navigation store |
| Activity logging | Dedicated service |
| Per-app visual overrides | Settings store |

The store also carries 13 migration steps, indicating significant schema evolution.

### useDrumStore (859 lines, 35 KB)

Similar monolith pattern — handles patterns, songs, FX, plugins, kits, grooves, and preferences in one store. Also has 13 migration steps.

**Recommendation**: Split into focused stores (e.g., `useDrumPatternStore`, `useDrumSongStore`, `useDrumPrefsStore`) with shared persistence middleware.

## Medium: Tight Coupling

### Navigation ↔ Settings

`NavigationCoordinator.resolveDefaultRoute()` directly reads `useChordStore.settings` for default tab resolution. This creates a bidirectional dependency between navigation and app settings.

### Startup ↔ Everything

`startupCoordinator.ts` (888 lines) imports from stores, navigation, updater, theme, diagnostics, and platform modules. It's a coordination hub by design, but the file size and import surface area make it fragile.

### Window-Level Hooks (Stagex)

`StageCorePanel` exposes functionality via `window.stageGoBack`, `window.openPresetsPanel`, `window.switchView`. This is a fragile integration pattern that bypasses React's component model.

## Medium: Relaxed TypeScript

The shared `tsconfig.base.json` has:

```json
{
  "strictFunctionTypes": false,
  "noImplicitAny": false
}
```

This significantly reduces type safety across the codebase. While `strictNullChecks: true` is enabled, the missing `noImplicitAny` allows implicit `any` types throughout.

**Recommendation**: Enable `noImplicitAny` incrementally, starting with `studio-core`.

## Medium: Encrypted Storage Overhead

All Zustand stores use encrypted localStorage (`secureReadLocal`/`secureWriteLocal`). Every state change triggers encrypt → serialize → write. For high-frequency state updates (e.g., velocity editing in Drumex), this creates unnecessary I/O.

**Recommendation**: Consider debouncing persistence writes or using a separate unencrypted store for high-frequency volatile state.

## Low: Static Data in TypeScript

Large static data files are compiled into the bundle:

| File | Size | Content |
|------|------|---------|
| `progressions.ts` | 111 KB | Chord progression data |
| `faqConstants.tsx` | 70 KB | FAQ text |
| `chords.ts` | 48.8 KB | Chord definitions |
| `progressionsEs.ts` | 32 KB | Spanish progressions |
| `songs.ts` | 17 KB | Song data |

**Recommendation**: Consider moving to JSON files loaded via dynamic `import()` or fetched on demand.

## Low: Missing Test Coverage

The `__tests__/` directory exists only under `lib/updater/`. No other module appears to have dedicated test files.

**Recommendation**: Add tests for navigation (dispatcher, validation, coordinator), stores (migration paths), and auth (sign-in flows).

## Debt Severity Summary

| Severity | Count | Top Items |
|----------|-------|-----------|
| **Critical** | 5 | DrumEditor 363KB, StudioHub 262KB, AccountCard 249KB, SongsPanel 195KB, DevTools 185KB |
| **High** | 3 | StageCorePanel duplication, monolithic stores, proxy proliferation |
| **Medium** | 4 | Navigation coupling, relaxed TypeScript, encrypted storage overhead, window hooks |
| **Low** | 2 | Static data bundling, missing tests |
