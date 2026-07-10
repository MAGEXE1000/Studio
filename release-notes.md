### Fixed
- Fixed updater prematurely showing "Studio is up to date" while the Android PackageInstaller was still active installing the update.
- Introduced an installation lock (`isInstallationLocked`) that prevents any automatic update check from running during or immediately after a system installation session.
- Prevented `StartupCoordinator` from resetting the startup pipeline while the PackageInstaller dialog is visible — the system was treating the installer overlay as an app-backgrounded event and incorrectly re-triggering a full startup cycle.
- Added `installationJustCompleted` flag that remains active from `INSTALL_SUCCESS` until the user dismisses the completion screen (or a 60-second safety timeout fires), closing the race window between session cleanup and startup update checks.
- Added installation lock diagnostic timeline (`installLockTimeline`) to every rejected automatic check for full production auditability.
