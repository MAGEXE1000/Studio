Release Date: 2026-08-01

### Added
- Restored responsive chord diagram previews inside category cards, list views, and search results inside Chordex.

### Fixed
- Normalized preferences routing mapping from `/chords/settings/settings` to `/chords/preferences` to eliminate nested duplicate layout regressions.
- Simplified the Updater screen by removing release channel options and embedded changelog timeline to prevent interface duplication.
- Moved the Developer Inspector Route Tracer overlay behind a persisted configuration toggle, disabling it by default.
- Wrapped the Language Selector bottom sheet inside a React Portal targeting the body element to fix scroll-offset positioning displacement bugs.
- Resolved the chord detail black screen navigation bug on both desktop and mobile viewports.
