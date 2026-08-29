# Version 4.5.49

Release Date: 2026-08-28

### Added

- Stagex Top Action Controls on Android: Restored upper Stage controls (`SharedFloatingHeader`) on Android editor view, wiring the ruler/measurement tool, PDF export sheet, presets panel, timeline/history, and real-time collaboration modal.

### Fixed

- Appearance Accent Color Picker Layout: Integrated the 2D custom color picker directly and flush inside the Appearance section, eliminating redundant nested card framing, dark vertical clipping rails, and fixed-width popup constraints.

### Performance

- Appearance Color Picker Drag Performance: Eliminated interaction stutter and frame-dropping during continuous touch dragging via single-measure cached bounding geometry, `requestAnimationFrame` coordinate batching, fine-grained Zustand store selectors, and isolated durable state persistence upon pointer release.
