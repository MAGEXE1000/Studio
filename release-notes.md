Release Date: 2026-08-06

### Fixed
- Fixed application load latency across all apps by pre-compiling sub-app entry points synchronously without dynamic promise fallbacks.
- Resolved SubAppWrapper mounting sequence ensuring navigation routes render immediately without empty screens.
- Eliminated artificial transition timeouts in ApplicationTransitionEngine to achieve 60 FPS smooth launch.
- Synchronized bottom navigation highlight indicator directly with drag gestures, removing smoothing delay.
- Optimized color pickers and theme updates to decouple store mutations from pointer events.
- Restored rotating app animation in About panel and fixed native Android updater interface.
