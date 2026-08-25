# Version 4.5.43

Release Date: 2026-08-25

Release Date: 2026-08-25

### Fixed

- Modal Surface Transparency: Eliminated excessive transparency across modal, alert, and dialog surfaces across all five Livex applications (Chordex, Drumex, Stagex, Groovex, Vocalex) by introducing canonical `--surface-dialog-bg` and `--surface-modal-surface` theme tokens and multi-layered elevation shadows.
- Navigation Icon Mapping: Resolved unmapped icon warnings for `drumex`, `stagex`, and `disc` in `AnimatedNavigationIcon` through normalized routing and complete filled variant support tables.
- Deprecated Vocalex Back Navigation: Migrated legacy `setVocalexBack` calls across Practice, Recording, Take Detail, and Mixer Lab panels to canonical priority-based `useBackHandler('nested', ...)` hooks.
- Theme System Integration: Standardized CSS token inheritance for interactive controls and floating headers across Light, Dark, and AMOLED themes.
