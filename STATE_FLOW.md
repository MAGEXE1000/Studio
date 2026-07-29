# State Flow

> **Purpose**: Documents all Zustand stores, their responsibilities, persistence, and subscriber relationships.

---

## Store Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        App Entry (App.tsx)                        │
│  Subscribes to: useChordStore, useNavigationStore                │
│  Initializes: StartupCoordinator, Auth, Theme, Sync             │
└─────────────┬───────────────────────────────────────┬────────────┘
              │                                       │
    ┌─────────▼─────────┐                 ┌──────────▼──────────┐
    │  useChordStore     │                 │ useNavigationStore  │
    │  (global settings) │                 │ (route history)     │
    │  PERSISTED         │                 │ NOT persisted       │
    └─────────┬──────────┘                 └──────────┬──────────┘
              │                                       │
     ┌────────┼────────┐                    ┌─────────┼─────────┐
     │        │        │                    │         │         │
  Theme    Sync    Settings              BottomNav  Hub    Transitions
  Engine   Engine  Panels                          Shell
```

---

## Primary Stores

### useChordStore
- **Location**: `packages/studio-core/src/store/useChordStore.ts`
- **Persistence**: `zustand/persist` → `secureWriteLocal` / `secureReadLocal` (encrypted localStorage)
- **Scope**: Global — app settings, chord workspace, song presets, UI prefs
- **Key state fields**:
  - `settings.theme` — 'dark' | 'light' | 'system' | 'dynamic'
  - `settings.accentColor` — color key from `ACCENT_COLORS`
  - `settings.amoled` — AMOLED black mode
  - `settings.language` — 'en' | 'es' | ...
  - `settings.animationSpeed` — animation speed preference
  - `settings.displayDensity` — UI density
  - `settings.perApp[appMode]` — per-app visual overrides
  - Chord workspace state (selected chord, instrument, etc.)
  - Song presets and custom chords
- **Subscribers**: Nearly every module reads from this store
- **Technical debt**: Too broad — holds unrelated concerns that cause unnecessary re-renders

### useDrumStore
- **Location**: `packages/studio-core/src/store/useDrumStore.ts`
- **Persistence**: `zustand/persist` → secure storage
- **Scope**: Drumex-only — patterns, kit, mixer, BPM
- **Key state fields**:
  - `patterns` — array of drum patterns
  - `currentPatternIndex` — active pattern
  - `bpm` — beats per minute
  - `kitType` — selected drum kit
  - `mixer` — per-instrument volume/pan/mute/solo
  - `isPlaying` — playback state
- **Subscribers**: `drumAudio.ts`, `DrumEditor.tsx`, `DrumPrefsPanel.tsx`

### useNavigationStore
- **Location**: `packages/studio-core/src/lib/navigation/useNavigationStore.ts`
- **Persistence**: NOT persisted — resets on app start
- **Scope**: Navigation history and transition state
- **Key state fields**:
  - `history: NavigationRoute[]` — route stack
  - `transitionType` — current transition animation type
  - `isTransitioning` — transition lock flag
  - `gestureState` — 'idle' | 'swiping' | 'cancelled' | 'committed'
  - `predictiveProgress` — gesture progress (0-1)
- **Subscribers**: `NavigationDispatcher`, `App.tsx`, `StudioHub`, `SharedNavigationBar`
- **Note**: Mutated primarily through `NavigationDispatcher` static methods, not direct actions

### useSettingsStore
- **Location**: `packages/studio-core/src/store/useSettingsStore.ts`
- **Persistence**: `zustand/persist`
- **Scope**: Settings-specific state

### useBottomNavigationStore
- **Location**: `packages/studio-core/src/lib/navigation/useBottomNavigationStore.ts`
- **Persistence**: NOT persisted
- **Scope**: Bottom nav visibility and collapse state
- **Subscribers**: `SharedNavigationBar`, `navScroll.ts`

### useApplicationTransitionStore
- **Location**: `packages/studio-core/src/lib/navigation/useApplicationTransitionStore.ts`
- **Persistence**: NOT persisted
- **Scope**: App switching transition animations

### useGroovexStore
- **Location**: `packages/ui-shared/src/features/groovex/useGroovexStore.ts`
- **Persistence**: NOT persisted (playback-only state)
- **Scope**: Groovex stem playback state
- **Subscribers**: Groovex feature components

---

## Persistence Map

| Data | Storage | Location |
|------|---------|----------|
| App settings (theme, language, etc.) | Encrypted localStorage | `useChordStore` → `secureWriteLocal` |
| Drum patterns | Encrypted localStorage | `useDrumStore` → `secureWriteLocal` |
| Settings | localStorage | `useSettingsStore` → persist |
| Vocalex takes | IndexedDB | `studio-core/src/repositories/VocalexRepository.ts` |
| Groovex stem cache | IndexedDB/Filesystem | `ui-shared/src/features/groovex/stemCache.ts` |
| Cloud sync data | Firestore / Supabase | `studio-core/src/lib/sync/` |
| Native preferences | Capacitor Preferences | `studio-core/src/lib/nativePrefs.ts` |
| APK download cache | Capacitor Filesystem | `studio-core/src/lib/updater/cacheManager.ts` |

---

## State Flow Patterns

### Settings Change Flow
```
User changes setting in UI
  → useChordStore.setState({ settings: { ...settings, field: newValue } })
  → zustand persist middleware → secureWriteLocal (encrypted localStorage)
  → themeEngine.applyThemeTokens() (if theme-related)
  → sync engine enqueues push (if sync enabled)
```

### Navigation Flow
```
Component calls NavigationDispatcher.push(route)
  → validation.normalizeAndValidateRoute(route)
  → NavigationCoordinator.resolveDefaults(route)
  → lockTransition(transitionType)
  → useNavigationStore.setState({ history: [...history, route] })
  → SharedNavigationContainer re-renders with new route
  → 300ms auto-unlock transition
```

### Auth State Flow
```
User signs in
  → Firebase Auth state change
  → subscribeAuth callback fires
  → attachSyncEngine(user)
  → sync epoch counter increments
  → initial sync pull from Firestore
  → UI updates via store subscriptions
```

### Sync Flow
```
Sync trigger (manual or timer)
  → enqueueRun(reason, mode)
  → lock in-flight runPromise
  → per-app domain serialization (parallel via Promise.allSettled)
  → hash-compare → skip if unchanged
  → Firestore/Supabase write (6s timeout per op)
  → overall 10s watchdog
  → state: idle → syncing → success/error → idle
```
