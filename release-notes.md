### Added
- Implemented static installer locking and session synchronization to block concurrent PackageInstaller requests.
- Added automatic native cleanup to force-abandon orphaned/interrupted installer sessions on app load and update start.
- Resolved installer active-session rejections by gracefully recovering and returning the active session ID.
- Switched the bottom navigation tabs to a fluid Material horizontal fade-through transition (24px shift + scale + crossfade).
- Removed clashing inline slide animations from the Profile tab to eliminate double transitions and layout stutter.
