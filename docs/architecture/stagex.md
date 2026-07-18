# Stagex — Stage / Performance Module

## Purpose

Stagex is the stage/performance view that embeds external content via an iframe, injects theme tokens, and manages screen orientation. It provides a presentation/performance mode for musicians.

## Location

```
packages/ui-shared/src/features/stagex/
├── components/       # (empty)
├── pages/
│   └── StageCorePanel.tsx   (116 KB, 2642 lines)
├── services/
└── state/
```

Additionally, `packages/ui-android/` provides an Android-specific implementation:

```
packages/ui-android/src/components/
└── StageCorePanel.tsx   (136 KB — Android-specific variant)
```

## Architecture

### Dual Implementation

Stagex has **two** implementations of `StageCorePanel`:

| Package | Size | Purpose |
|---------|------|---------|
| `ui-shared` | 116 KB | Shared/web implementation |
| `ui-android` | 136 KB | Android-specific implementation with native features |

The Android app imports `StageCorePanel` from `@workspace/ui-android`, which re-exports its platform-specific variant. The web app uses the shared version.

### Iframe Integration

The stage view embeds content via an iframe and bridges theme/accent color CSS variables into the embedded document:

- Injects accent color CSS custom properties
- Injects theme mode (dark/light) 
- Handles bidirectional communication between parent and iframe

### Screen Orientation

Uses `@capacitor/screen-orientation` to lock orientation during performance mode (landscape on Android).

## Dependencies

| Dependency | Source | Purpose |
|------------|--------|---------|
| `useChordStore` | studio-core | Settings, theme |
| `NavigationDispatcher` | studio-core | Navigation |
| `motion/react` | Framer Motion | Page transitions |
| `@capacitor/screen-orientation` | Capacitor | Orientation lock |
| `AnimatedActionButton` | ui-shared | Animated buttons |
| `AppModeMenuLogo` | ui-shared | App logo |
| `WebAppSectionDock` | ui-shared | Web section dock |
| `SmartLoading` | ui-shared | Loading screen |
| `StagexPanelSkeleton` | ui-shared | Skeleton loading |
| `Button`, `Input` | ui-shared | Design system |
| `DialogScaffold` | ui-shared | Modal dialogs |

## Window-Level Hooks

The stage view exposes global hooks on `window` for external control:

- `window.stageGoBack` — trigger back navigation
- `window.openPresetsPanel` — open presets panel
- `window.switchView` — switch between stage views

## Navigation

Entry via:
```
NavigationDispatcher.push({ app: 'stage' })
NavigationDispatcher.push({ app: 'stage', page: 'view' })
```

## Known Limitations

- Two separate 100+ KB implementations of `StageCorePanel` is significant code duplication
- The iframe-based architecture adds complexity for theme bridging
- Window-level hooks are a fragile integration pattern
