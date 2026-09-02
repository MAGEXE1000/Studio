# Version 4.5.50

Release Date: 2026-09-02

### Improved

- Canonical Tab Transitions Across Studio Apps: Unified navigation animations onto `StudioPageTransition` with canonical `200ms cubic-bezier(0.22, 1, 0.36, 1)` easing and zero-overshoot motion, eliminating spring bounce across Groovex, Vocalex, and Hub tabs.
- Android UI Runtime Performance: Coalesced `BottomNavigationController` DOM mutation sweeps with `requestAnimationFrame` to eliminate layout query storms, decoupled `SongPracticeView` playback timer to eliminate 60 FPS effect teardown churn, and narrowed broad Zustand store subscriptions in `App.tsx`, `StudioHub.tsx`, `UpdateIndicator.tsx`, and `StageCorePanel.tsx` to stop cascaded re-renders.

### Fixed

- Stagex Header Architecture Alignment: Aligned Stagex Android header architecture with canonical Studio headers, removed obsolete pill navigation measurements and orphaned timers, and guarded canvas touch telemetry against unnecessary state mutations.
