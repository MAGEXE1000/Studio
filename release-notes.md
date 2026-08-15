# Version 4.5.32

Release Date: 2026-08-15

### Added

- Hardened Android intent content resolution boundary with dynamic `PackageManager` provider self-exclusion in `SafeContentResolver` to prevent Confused Deputy attacks.
- Modernized native-to-web IPC bridge by replacing dynamic `evaluateJavascript` execution with structured Capacitor events (`AppInstallerPlugin.instance.emitSharedFileReceived`) for secure shared file delivery.
- Implemented static enum theme matcher in `MainActivity.kt` ensuring zero untrusted script execution in WebView context.
- Streamlined `SafeContentResolver.openSafeInputStream` to support physical file descriptors and virtual cloud documents (Google Drive, OneDrive, MediaStore) while enforcing strict 5MB text and 50MB stream bounds.
- Added comprehensive Android JVM security unit test suite in `SafeContentResolverTest.java` verifying scheme validation, authority normalization, and directory traversal protections.
