# Version 4.5.5

Release Date: 2026-08-07

Release Date: 2026-08-07

### Fixed
- Fixed critical RootApp runtime TDZ crash (`ReferenceError: Cannot access 'xe' before initialization`) by removing unused `rawProgress` and `downloadPct` variables from `UpdateIndicator.tsx`.
- Restored the exact 3-stage GitHub Release Pipeline (Preflight, Build, Package & Sign, Publish) as Run #703.

