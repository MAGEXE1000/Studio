# Version 4.5.48

Release Date: 2026-08-28

### Added

- Stagex & Studio 2D Fluid Color Picker: Redesigned the color picker into a production-grade 2D control with continuous saturation-value field, 360° rainbow hue spectrum slider, checkerboard alpha transparency slider, circular draggable handles, HEX and opacity input validation, and full Light/Dark/AMOLED theme parity.

### Fixed

- Stagex Android Viewport Layout & Sizing: Fixed stage canvas sizing and scaling on mobile viewports so that the stage surface properly occupies available phone screen space.
- Stagex Tab Navigation & State Preservation: Resolved disappearing/blank stage regressions across tab transitions (`Stage` ↔ `Setup` ↔ `Preferences`) by restoring canvas opacity immediately and resetting layout cache.
- Drumex Android Viewport Sizing: Corrected viewport height and safe-area margins in Drumex pattern library and editor screens.
- Conservative Performance Optimizations: Eliminated broad subtree mutation storms during stage element dragging, prevented synchronous layout recalculation in PA sound coverage, cached theme engine CSS variable mutations, and isolated sub-app re-render boundaries in `SharedAppShell`.
