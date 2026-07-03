### Fixed
- Eliminated false "App is up to date" when remote metadata fetch failed.
- Fixed auto-check exceptions silently returning to idle instead of recovery.
- Added explicit diagnostics on every non-update path.

### Improved
- Every failure path now exposes explicit reason codes, stack traces, and timestamps.
- Version comparison populates full decision rationale in diagnostics.
- Synchronized all version sources to 3.7.65 / versionCode 193.
