# Groovex — Groove Player Module

## Purpose

Groovex is a music player for groove-based playback with library browsing, a full player interface, and module preferences.

## Location

```
packages/ui-shared/src/features/groovex/
├── components/
│   ├── GroovexLibrary.tsx       (16 KB)
│   ├── GroovexPlayer.tsx        (46 KB)
│   └── GroovexPreferences.tsx   (21 KB)
├── pages/
│   └── GroovexApp.tsx           (14 KB, 372 lines)
├── services/
├── state/
│   └── useGroovexStore.ts       (3 KB)
└── utilities/
```

Additionally, `packages/ui-shared/src/groovex/` contains 8 proxy/re-export files for cleaner imports.

## Architecture

### GroovexApp.tsx (14 KB, Entry Point)

The main entry component uses `SharedNavigationContainer` for sub-view management with 3 views:

```typescript
const VIEW_ORDER = ['library', 'player', 'preferences'];
```

All sub-components are **lazy-loaded** via `React.lazy()`.

### GroovexLibrary.tsx (16 KB)

Groove library browser:

- Browse and search grooves
- Filter by tags, style, tempo
- Preview playback
- Add to player queue

### GroovexPlayer.tsx (46 KB)

Full groove player interface:

- Transport controls (play, pause, stop, seek)
- Tempo adjustment
- Stem/track mute/solo
- Waveform visualization
- Loop controls

### GroovexPreferences.tsx (21 KB)

Module preferences:

- Playback settings
- Audio output configuration
- Default view selection

## State Management

### useGroovexStore (3 KB)

A small Zustand store dedicated to Groovex module state. This is the only feature module besides Chordex and Drumex that maintains its own Zustand store.

## Dependencies

| Dependency | Source | Purpose |
|------------|--------|---------|
| `useChordStore` | studio-core | App settings, theme |
| `NavigationDispatcher` | studio-core | Navigation |
| `useGroovexStore` | Local state | Module-specific state |
| `SharedNavigationContainer` | ui-shared | Panel transitions |
| `AppModeMenuLogo` | ui-shared | App logo |
| `WebAppSectionDock` | ui-shared | Web section dock |
| `navStyles` | ui-shared | Shared nav styling |

## Navigation

Uses `SharedNavigationContainer` with `VIEW_ORDER: ['library', 'player', 'preferences']`.

Entry via:
```
NavigationDispatcher.push({ app: 'groovex' })
NavigationDispatcher.push({ app: 'groovex', page: 'library' })
NavigationDispatcher.push({ app: 'groovex', page: 'player' })
NavigationDispatcher.push({ app: 'groovex', page: 'preferences' })
```

Default page resolved from `settings.defaultGroovexView` in `NavigationCoordinator`.

## Key Characteristics

- **Lazy loading**: All sub-components load on demand
- **Clean separation**: Unlike Drumex or Chordex, Groovex has well-separated components
- **Small store**: Only 3 KB of dedicated state — most state lives in `useChordStore`
- **Material 3 transitions**: Uses the same fade-through animation system as other modules
