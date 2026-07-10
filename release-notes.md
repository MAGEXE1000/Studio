### Fixed
- Fixed premature "Studio is up to date" message appearing while Android is still installing the update.
- Prevented the auto-close timer from resetting the installation lock after a successful install, which allowed stale update checks to run in the old app process.
- Added a safety guard to dismissUpdate so it cannot reset state while the PackageInstaller is actively running.
