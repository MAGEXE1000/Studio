# Version 4.5.58

Release Date: 2026-09-04

### Added

- Comprehensive Bilingual Localization: Complete English and Spanish (en/es) translation coverage across all Studio tools and Stagex screens, with reactive language selector sheet and persistent locale storage.

### Fixed

- Stagex Clean Element Data Defaults: Completely eliminated phantom production data defaults on new stage elements (performer names, microphones, DIs, wireless packs, and boilerplate logistics notes).
- Strict +48V Phantom Power Invariant: Hardened phantom power defaults to false across in-app inspectors, projection adapters, and PDF export sheets, showing canonical em-dash (`—`) when unassigned.
- Stagex Canvas Centering & Menu Anchoring: Fixed canvas vertical positioning, toolbar layout hierarchy, and element menu anchor stability.
- External Link Security Hardening: Enforced `rel="noopener noreferrer"` across all external anchor elements in share dialogs.

### Changed

- Theme-Governed Canvas Appearance: Deprecated manual canvas background color selection in Preferences in favor of strict system theme alignment (Light, AMOLED pure black, and Dark).
- Standardized Empty State Placeholders: Projected em-dash (`—`) across all unassigned technical specifications and audio channel mappings.
