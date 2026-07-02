# Reusable Knowledge — Native Update Infrastructure

This document describes the native PackageInstaller integration and the APK verification pipelines.

---

## 1. Native bridge PackageInstaller
- **APK Streaming**: The native Java plugin `AppInstallerPlugin.java` streams downloaded APK files directly to the Android OS installer session. It registers a BroadcastReceiver to listen for install completion callbacks.
- **Fail-closed Verification**: Before committing the installer session, it validates the download file's size, package ID, and SHA256 integrity checksum. If any parameter fails validation, it drops the session immediately.

Source:
* [android.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/android.md#L30-L55)

---

## 2. Keystore Signing
- **Fingerprint Lock**: Release packages are signed and validated against the production SHA256 signature hash:
  `900cf259185c81100cda8bb08571fa23552e9789131cf07a8f4056e4d4129206`.
- **Keystore Management**: Signing keys must never be committed. They are loaded dynamically on CI via secrets configurations.

Source:
* [AGENTS.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/AGENTS.md#L36)
