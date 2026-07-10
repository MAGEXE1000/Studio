### Fixed
- Fixed a race condition that caused "Studio is up to date" to appear prematurely during Android APK installation.
- The updater now waits for the native PackageInstaller result query to fully resolve before triggering any automatic update check on app resume.
- Eliminated the timing window where a 200ms-debounced update check could read the installation-lock state before the native IPC response had set it, triggering a false version-match comparison.
- Installation lock diagnostics now record `RACE_BLOCKED` events in the install lock timeline for production visibility.
