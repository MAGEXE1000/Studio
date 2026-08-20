# Version 4.5.34

Release Date: 2026-08-19

### Added

- Redesigned mobile bottom navigation with unified-object center-anchor collapse scaling (`containerScale`), eliminating internal item layout reflow.
- Replaced multi-transform Search / App Changer bubble animation with in-place opacity-only fade during downward scroll.
- Migrated bottom navigation dock and floating bubble materials to canonical CSS design tokens (`--surface-topbar-*`, `--surface-float-blur`) with full Dark, Light, and AMOLED compatibility.
- Retuned navigation spring physics to critically damped curves (`stiffness: 340, damping: 28, mass: 0.9`) for a smooth, physical, native feel.
