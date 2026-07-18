# Shared UI Components

All shared UI lives in `packages/ui-shared/src/`. This package provides cross-platform React components, feature modules, the animation framework, and navigation containers.

## Component Library

### Design System (`components/design-system/`)

| Component | File | Purpose |
|-----------|------|---------|
| `Button` | `StudioDesignSystem.tsx` (25 KB) | Themed button with variants |
| `EmptyState` | `StudioDesignSystem.tsx` | Empty state placeholder |
| `Input` | `StudioDesignSystem.tsx` | Themed text input |
| `BottomNavigation` | `StudioDesignSystem.tsx` | Navigation bar wrapper |
| `WebToolbar` | `WebDesignSystem.tsx` (9.3 KB) | Web-specific toolbar |
| `WebButton` | `WebDesignSystem.tsx` | Web-specific button |

### Layout System (`components/layout/`)

| Component | Purpose |
|-----------|---------|
| `DialogScaffold` | Modal/dialog layout wrapper |
| `ScreenScaffold` | Full-screen page layout wrapper |
| `ScrollScaffold` | Scrollable content wrapper |

Source: `StudioLayoutSystem.tsx` (14 KB)

### Chord Diagrams (`components/diagrams/`)

| Component | Purpose |
|-----------|---------|
| `ChordDiagram` | Generic chord diagram renderer |
| `GuitarDiagram` | 6-string guitar fretboard |
| `FourStringDiagram` | Bass/ukulele 4-string fretboard |
| `PianoDiagram` | Piano keyboard chord visualization |

### Cards (`components/cards/`)

| Component | Size | Purpose |
|-----------|------|---------|
| `AccountCard` | 249 KB | User account management card (large) |
| `StudioAuthCard` | 13 KB | Authentication form card |
| `GradientBorderCard` | 1 KB | Decorative gradient border wrapper |

### Feedback (`components/feedback/`)

| Component | Purpose |
|-----------|---------|
| `ErrorBoundary` | Global error boundary (25 KB) |
| `DisabledAccountScreen` | Account disabled display |
| `PendingDeletionScreen` | Account pending deletion display |

### Loading States (`components/loading/`)

| Component | Purpose |
|-----------|---------|
| `AppLoadingScreen` | Full-screen app loading (via `SmartLoading.tsx`) |
| `AppSpinner` | Inline spinner |
| `StudioSkeleton` | Skeleton loading states (StagexPanelSkeleton, etc.) |

### Lottie Animations (`components/lottie/`)

8 Lottie components wrapping JSON animation files:
`AppLottie`, `EmptyStateLottie`, `LoadingLottie`, `MicWavesLottie`, `MusicNotesLottie`, `NoResultsLottie`, `SuccessLottie`, `VinylLottie`

### Icons (`components/icons/`)

| Component | Purpose |
|-----------|---------|
| `AppModeMenuLogo` | Dynamic app mode logo (13 KB) |
| `ChordexLogo` | Chordex branding logo |
| `DownloadIcon` | Download action icon |
| `NavIcons` | Navigation icons (IconSettings, etc.) |

### Progress (`components/progress/`)

| Component | Purpose |
|-----------|---------|
| `ElasticSlider` | Elastic range slider with animated thumb |
| `StudioProgressBar` | Themed progress bar |
| `StudioCountUpPercentage` | Animated percentage counter |

### Typography & Controls (`components/typography/`)

| Component | Purpose |
|-----------|---------|
| `SettingControls` | Toggle, slider, select controls for settings |
| `StudioThemeToggler` | Theme switch component |
| `StudioTitleReveal` | Animated title reveal |
| `ScrollFade` / `useScrollFade` | Fade-on-scroll effect |

### Update System (`components/update/`, `components/sheets/`)

| Component | Size | Purpose |
|-----------|------|---------|
| `UpdateIndicator` | 87 KB | Main update notification and download UI |
| `StudioUpdateScreen` | 17 KB | Full-screen update prompt |
| `UpdateDiagnosticsSheet` | 55 KB | Diagnostics bottom sheet |
| `ChangelogSheet` | 3.6 KB | Release changelog display |

### Hub (`components/hub/`)

| Component | Size | Purpose |
|-----------|------|---------|
| `StudioHub` | 262 KB | Main hub/dashboard (very large) |
| `hubConstants` | 11 KB | Hub configuration data |
| `faqConstants` | 70 KB | FAQ data and components |

### DevTools (`components/devtools/`)

| Component | Size | Purpose |
|-----------|------|---------|
| `DevToolsDashboard` | 185 KB | Developer tools dashboard |

### Updater Diagnostics (`components/updater-diagnostics/`)

Full diagnostics UI suite:
`DiagnosticsStack`, `LiveConsole`, `NavDiagnosticsWidget`, `ProductionActions`, `ReportPreview`, `StateMachineVisualizer`, `TelemetryGrid`, `UpdaterDiagnosticsPage` (47 KB), `centralizedClipboard`, `diagnosticsGenerator` (35 KB)

## Animation Framework

### AppAnimationSystem (`navigation/AppAnimationSystem.tsx`, 12 KB)

7 modules providing the complete animation framework:

| Module | Purpose |
|--------|---------|
| `MOTION_DURATIONS` / `MOTION_EASINGS` | Duration presets (fast: 0.18s, normal: 0.32s, slow: 0.45s) and cubic-bezier curves |
| `usePrefersReducedMotion()` | Respects system `prefers-reduced-motion` and `settings.animationSpeed` |
| `useAnimationSpeed()` | Returns speed coefficient (0.6 for fast, 1.0 for normal) |
| `AnimationCoordinator` | Singleton with `getDuration()`, `getTransition()`, `startTransition()` |
| `PageTransition` | Framer Motion page wrapper (`slide`, `fade`, `scale` types) |
| `AppEntryTransition` | Spring-based entry animation |
| `StaggeredReveal` | Staggered children entrance animation |
| `AnimatedAppHeader` | Character-by-character title animation |

All animations use `motion/react` (Framer Motion) and respect reduced-motion preferences.

### SharedNavigationContainer (`navigation/SharedNavigationContainer.tsx`, 8.4 KB)

CSS-based animated panel switcher implementing **Material 3 Fade-Through** transitions.

**Props:**
```typescript
interface Props {
  activeView: string;
  direction?: 'left' | 'right';
  viewOrder?: string[];
  children: (viewId: string) => ReactNode;
  variant?: string;
}
```

**Features:**
- Keep-alive views (visited panels remain mounted)
- Directional transitions based on `viewOrder` index comparison
- 280ms active transition, 150ms exit
- CSS: `cubic-bezier(0.2, 0, 0, 1)` easing

**Used by:** DrumEditor, GroovexApp, VocalexApp

### navStyles (`navigation/navStyles.ts`)

Shared CSS transition utilities for the navigation bar:
- `SHARED_NAV_TRANSITION` — CSS transition string (250ms)
- `getSharedNavTransform()` — Y translation for hide/collapse
- `getSharedNavOpacity()` — Opacity for hide/collapse

## Feature Module Patterns (`features/`)

All feature modules follow a consistent directory structure:

```
features/<module>/
├── components/       # Module-specific React components
├── pages/            # Top-level page components
├── services/         # Module-specific services
├── state/            # Zustand stores (if needed)
├── types/            # TypeScript type definitions
└── utilities/        # Helper functions
```

5 feature modules: `chordex`, `drumex`, `groovex`, `stagex`, `vocalex` — each documented in their own architecture file.

## Platform-Specific UI Packages

### ui-android (`packages/ui-android/`)

Thin wrapper that:
- Re-exports `BottomNav`, `UpdateIndicator`, `UpdateDiagnosticsSheet`, `StudioUpdateScreen` from `@workspace/ui-shared`
- Provides its own `StageCorePanel` (136 KB) — Android-specific implementation

### ui-web (`packages/ui-web/`)

Web-specific layout components:
- `WebSidebarLayout` (20 KB) — Main web layout with sidebar
- `StudioSidebar` (10 KB) — Sidebar with `SidebarProvider`, `SidebarInset`, `useSidebar`
- `WebAppSectionDock` (8.6 KB) — Section dock for web
- `StudioLandingPage` (6.9 KB) — Web landing page with sub-components

## Proxy Re-export Pattern

The root of `ui-shared/src/components/` contains ~46 proxy files that re-export components for cleaner import paths. For example:
```typescript
// components/SharedNavigationContainer.tsx
export { SharedNavigationContainer } from '../navigation/SharedNavigationContainer';
```

This allows consumers to import from a flat component namespace rather than navigating the internal directory structure.
