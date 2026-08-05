Release Date: 2026-08-04

### Fixed
- Refactored release-firebase.mjs pipeline into a strict two-phase atomic transaction to prevent partial remote publication when downstream validations fail.
- Fixed baseline previous-release resolution in releaseState.mjs and discoverApkAsset to strictly exclude the current building version and prevent self-comparison errors.
- Enforced complete local manifest and contract validation before GitHub release creation and Firebase deployment.
