Release Date: 2026-07-26

## Fixed
- Fixed Developer Inspector Rules of Hooks violation by guaranteeing unconditional hook execution order across toggle enable/disable cycles, eliminating React Error #300 and #310 crashes.
- Fixed freeze persistence issue by excluding `isFrozen` state from store hydration on page reload.
- Fixed Stagex Setup screen black rendering by mapping `Setup` to `SetupHub` and `Preferences` to `Assistant` in the view switching pipeline so iframe receives valid view targets.
- Fixed error duplication in DevTools by implementing smart error fingerprinting deduplication and tracking occurrence count, first seen, and last seen timestamps.

## Improved
- Redesigned Developer Inspector dock into a sleek 320px floating Edge card with translucent backdrop blur and smooth spring physics.
- Standardized all error boundary recovery actions and warning inspect actions to use the canonical `CopyButton` component.
- Connected `ErrorBoundary.componentDidCatch` exceptions directly into the devTools error buffer pipeline.
