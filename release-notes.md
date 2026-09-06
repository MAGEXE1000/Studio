# Version 4.5.68

Release Date: 2026-09-06

### Added

- Studio/Livex Android System Updater Redesign: Implemented the new flagship Android updater dialog matching the approved design system specifications with 400px width constraint, rounded-28 perimeter, micro scrollbar, and hardware-accelerated CSS state morphing transitions.
- Tactile Interaction & Visual Indicators: Added tactile button feedback (.livex-tap-press scale down on active touch), continuous scanning beam animations for package verification, and real-time download metrics (transferred MB, speed, ETA).

### Fixed & Improved

- Full Theme Parity: Engineered pixel-perfect support for Light (#ffffff / #f8fafc), Dark (#0c0d10 / #16171b), and AMOLED (true #000000 / #08080a) themes with canonical surface blur tokens.
- Categorized Release Notes Engine: Release changelogs are dynamically classified into distinct, color-coded badges (NEW in emerald, AUDIO ENGINE in blue, FIXED & IMPROVED in amber) with automatic fallback for single-version manifests.
- End-to-End Pipeline Wiring: Connected real-time download progress events, graceful download cancellation, cryptographic SHA-256 verification, and native Android PackageInstaller handoff.
