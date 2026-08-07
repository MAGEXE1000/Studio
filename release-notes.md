Release Date: 2026-08-07

### Fixed
- Fixed StudioHub startup crash (`ReferenceError: Cannot access 'Se' before initialization`) by configuring Rollup bundling with a dedicated `motion-vendor` chunk to prevent temporal dead zones.

### Added
- Completed repository-wide migration to the official BeUI component library, successfully replacing all legacy themes, accordions, modals, and loaders.
