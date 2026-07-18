# Vocalex — Vocal Training Module

## Purpose

Vocalex is the vocal coaching and training module with recording, takes management, pitch analysis, harmonizer, practice detection, and lab experiments.

## Location

```
packages/ui-shared/src/features/vocalex/
├── components/
│   ├── CoachPanel.tsx          (4.6 KB)
│   ├── HarmonizerSheet.tsx     (36 KB)
│   ├── LabPanel.tsx            (57 KB)
│   ├── PitchPanel.tsx          (21 KB)
│   ├── PracticePanel.tsx       (12 KB)
│   ├── RecordingView.tsx       (15 KB)
│   ├── TakeDetailView.tsx      (20 KB)
│   └── TakesPanel.tsx          (11 KB)
├── pages/
│   └── VocalexApp.tsx          (25 KB, 584 lines)
├── services/
└── utilities/
```

Additionally, `packages/ui-shared/src/vocalex/` contains 15 proxy/re-export files.

## Architecture

### VocalexApp.tsx (25 KB, Entry Point)

Uses `SharedNavigationContainer` for sub-view management with 4 primary views:

```typescript
const NAV_ORDER = ['coach', 'recorder', 'takes', 'preferences'];
```

Features a **custom BottomNav** (not shared with Chordex) with 4 tabs:
- Coach (`IconCoach` — custom SVG)
- Recorder (`IconMic` — custom SVG)
- Takes (`IconTakes` — custom SVG)
- Preferences (`IconPreferences` — custom SVG)

Most sub-components are **lazy-loaded**.

### Components

| Component | Size | Purpose |
|-----------|------|---------|
| `CoachPanel` | 4.6 KB | Vocal coaching interface with tips and exercises |
| `HarmonizerSheet` | 36 KB | Real-time vocal harmonizer settings and controls |
| `LabPanel` | 57 KB | Experimental lab features for vocal analysis |
| `PitchPanel` | 21 KB | Real-time pitch detection and visualization |
| `PracticePanel` | 12 KB | Guided vocal practice with progress tracking |
| `RecordingView` | 15 KB | Audio recording interface |
| `TakeDetailView` | 20 KB | Individual recording playback and analysis |
| `TakesPanel` | 11 KB | Recording history and management |

## Data Layer

Vocalex has its own IndexedDB-backed data layer in `packages/studio-core/src/vocalex/`:

| File | Purpose |
|------|---------|
| `labSessionDb.ts` (4.3 KB) | Lab session persistence (IndexedDB) |
| `takesDb.ts` (3 KB) | Recording takes persistence (IndexedDB) |

This is distinct from the Zustand/localStorage pattern used by other modules — Vocalex stores binary audio data that doesn't fit in localStorage.

## Dependencies

| Dependency | Source | Purpose |
|------------|--------|---------|
| `useChordStore` | studio-core | App settings, theme |
| `NavigationDispatcher` | studio-core | Navigation |
| `SharedNavigationContainer` | ui-shared | Panel transitions |
| `AppModeMenuLogo` | ui-shared | App logo |
| `WebAppSectionDock` | ui-shared | Web section dock |
| `NavIcons` (IconSettings) | ui-shared | Settings icon |
| `navStyles` | ui-shared | Shared nav styling |
| `headerBack` | Local utility | Back navigation helper |
| `pitchy` | npm | Pitch detection library |

## Android Permissions

Vocalex requires:
- `RECORD_AUDIO` — microphone access for recording
- `MODIFY_AUDIO_SETTINGS` — audio engine control

The WebView auto-grants microphone permissions via the custom `BridgeWebChromeClient` in `MainActivity.java`.

## Navigation

Uses `SharedNavigationContainer` with `NAV_ORDER: ['coach', 'recorder', 'takes', 'preferences']`.

Entry via:
```
NavigationDispatcher.push({ app: 'vocalex' })
NavigationDispatcher.push({ app: 'vocalex', page: 'coach' })
NavigationDispatcher.push({ app: 'vocalex', page: 'recorder' })
NavigationDispatcher.push({ app: 'vocalex', page: 'takes' })
NavigationDispatcher.push({ app: 'vocalex', page: 'preferences' })
```

Default page resolved from `settings.defaultVocalexTab` in `NavigationCoordinator`.

## Key Characteristics

- **Custom BottomNav**: Has its own navigation bar separate from the Chordex BottomNav
- **IndexedDB storage**: Uses IndexedDB for binary audio data (takes, lab sessions) rather than localStorage
- **Pitch detection**: Uses the `pitchy` library for real-time pitch analysis
- **Lab experiments**: The LabPanel (57 KB) supports experimental vocal analysis features
- **Lazy loading**: All sub-components loaded on demand
- **Good separation**: Components are well-factored with single responsibilities
