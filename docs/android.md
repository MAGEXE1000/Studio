# Chordex Studio — Android Platform Guide

This document describes Android-specific build configurations, native bridge architectures, permissions structures, and UI requirements.

---

## 1. Native Bridge Architecture (Capacitor)

The Android application compiles React web assets into a native APK shell via Capacitor. Communication utilizes custom native plugins registered on application startup:

* **`AppInstallerPlugin`**: A custom Java plugin implementing advanced system operations:
  * `getDeviceInfo()`: Queries brand, model, battery, storage, and network interface statuses.
  * `getExtendedDiagnostics()`: Accesses active PackageInstaller session details.
  * `inspectApk(filePath)`: Parses package name, version, certificates, and signature validity of cached update files.
  * `verifyApkSha256(filePath, expectedHash)`: Computes and matches SHA hashes for update binaries.
  * `copyToClipboard(text)`: Bridges diagnostic reports directly to the Android Clipboard Manager.
  * `openUnknownAppSourcesSettings()`: Launches the OS Unknown Apps Installation Permission panel.
  * `resumePendingInstall()` / `resumePackageInstallerSession()`: Re-establishes installer context after app lifecycle events.

* **Helper Native Classes**:
  * **`InstallReceiver.java`**: Receives broadcast intents from the Android OS PackageInstaller indicating status updates (Success, Failure, User Action Pending).
  * **`OtaCheckWorker.java`**: Implements Android WorkManager background schedules to query release channels and trigger local notification alerts for available updates.
  * **`MainActivity.java`**: Bootstraps the Capacitor WebView and registers `AppInstallerPlugin` on launch.

Source:
* `apps/studio-android/android/app/src/main/java/com/chordex/app/MainActivity.java`
* `apps/studio-android/android/app/src/main/java/com/chordex/app/AppInstallerPlugin.java`
* `apps/studio-android/android/app/src/main/java/com/chordex/app/InstallReceiver.java`
* `apps/studio-android/android/app/src/main/java/com/chordex/app/OtaCheckWorker.java`

---

## 2. PackageInstaller & APK Installation Lifecycle

Unlike basic Android applications, Chordex Studio manages updates in-place using the native `PackageInstaller` API instead of standard `Intent.ACTION_VIEW` triggers (which cause file leaks and lack execution callbacks).

```
┌─────────────┐       ┌────────────────────┐       ┌────────────────────┐
│ Downloaded  │       │ Create Installation│       │   Register Callback│
│ update.apk  ├──────>│       Session      ├──────>│      Receiver      │
└─────────────┘       └─────────┬──────────┘       └─────────┬──────────┘
                                │                            │
                                ▼                            ▼
                      ┌────────────────────┐       ┌────────────────────┐
                      │ Stream write bytes │       │ Commit & Launch OS │
                      │   into session     │       │     UIPrompts      │
                      └────────────────────┘       └────────────────────┘
```

### Installation Steps
1. **Initialize Session**: Queries the system to establish a new `PackageInstaller.Session` and obtains a unique `sessionId`.
2. **Stream Binary**: Streams the downloaded APK binary directly into the session stream.
3. **Commit Install**: Commits the session. The OS intercepts execution, launching the standard permission overlay dialog.
4. **Monitor Events**: The native plugin registers `InstallReceiver` to receive broadcast intent callbacks (e.g. `STATUS_PENDING_USER_ACTION`, `STATUS_SUCCESS`, `STATUS_FAILURE_STORAGE`).

Source:
* `apps/studio-android/android/app/src/main/java/com/chordex/app/AppInstallerPlugin.java`
* `apps/studio-android/android/app/src/main/java/com/chordex/app/InstallReceiver.java`

---

## 3. UI Adaptation: Safe Areas & Notch Spacing

Android viewport styling must respect system notch bars and bottom navigation drawers.

* **Viewport Constraint**: The main application navigation bar occupies a height of `96px` (16dp).
* **Scroll Padding**: Scrollable containers must utilize bottom padding values of `calc(var(--content-bottom-pad, 96px) + 20px)`. Floating overlays or subview panels require at least `calc(var(--content-bottom-pad, 96px) + 80px)` bottom margin to prevent button coverage.
* **Layout Boundaries**: Do not position absolute elements inside safe-area regions. Use CSS `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` properties.

Source:
* `packages/ui-shared/src/components/DevToolsDashboard.tsx`
* `packages/ui-android/src/components/StageCorePanel.tsx`

---

## 4. Build, Versioning, & Release Signing

### Version Manifest
All version variables reside under `apps/studio-android/android/app/build.gradle`:
* `versionCode`: Integer value incremented sequentially on each release (e.g., `184`).
* `versionName`: Semantic version label matching package releases (e.g., `3.7.56`).

### Keystore Configuration
Production release signatures utilize standard Android Keystore files configured via environment variables inside the CI release workflow:
* `ANDROID_KEYSTORE_BASE64`: Encrypted base64 keystore credentials.
* `ANDROID_KEYSTORE_PASSWORD`: Keystore file password.
* `ANDROID_KEY_ALIAS`: Keystore certificate key alias.
* `ANDROID_KEY_PASSWORD`: Keystore certificate private key password.

Source:
* `apps/studio-android/android/app/build.gradle`
* `.github/workflows/android-release.yml`
