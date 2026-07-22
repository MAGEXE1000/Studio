# Version 4.2.37

Release Date: 2026-07-22

Release Date: 2026-07-22

## Fixed
- Stabilized global search by removing duplicate index registrations and unmounted stale closures from the Hub, preventing runtime crashes.
- Resolved React Hook Ordering violation (#300) in the Shared Navigation Bar by raising `useTransform` to the component top level.

## Improved
- Completely purged legacy header app switcher pill (`AppModeMenuLogo`) across Chordex, Drumex, Stagex, Groovex, Vocalex, and Settings for clean page headers.
