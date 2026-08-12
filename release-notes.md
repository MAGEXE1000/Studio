# Version 4.5.25

Release Date: 2026-08-11

### Added

- Hardened the Android production release pipeline to make it deterministic, safe, and fast.
- Implemented an idempotent version synchronization mechanism with SHA-256 content verification.
- Integrated a canonical version guard that validates release candidate versionCode against production.
- Added versionCode collision safety checks that fail-fast if MIN or PAT versions would cause collisions.
- Configured a Preflight-to-Build release state hash check to verify checkout equivalence.
- Restored standard dirty-tree checking in Vite without generated-file allowlists.
