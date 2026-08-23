# Version 4.5.36

Release Date: 2026-08-22

### Fixed

- Resolved critical section-entry runtime exception (`ReferenceError: isLight is not defined`) in `HubSettings` by declaring `isLight` derived from active settings and media queries.

### Added

- Refactored shared Liquid Glass design tokens with realistic optical transparency, live backdrop blur, and soft micro-specular responses across Dark, Light, and AMOLED themes.
- Upgraded mobile bottom navigation dock with natural environmental transparency, soft radial depth vignetting, and clean optical boundaries.
- Modernized top bar material system with soft curvature-aware specular highlights, removing hard 1px artificial white rim lines.
- Cleaned Hub module launcher cards by eliminating colored right-side circular highlight blobs and hard rim lines for a premium, unified aesthetic.
- Removed capsule container surrounding the Livex logo in Hub header for clean, native visual alignment.
