# Chordex Studio — Troubleshooting Guide

This guide details common engineering failures, build issues, OTA errors, and system recovery steps.

---

## 1. Android & Gradle Build Issues

### Gradle Task OutOfMemoryError
* **Symptom**: Compiling native packages via Android Studio or GitHub Action runners fails with Java heap memory exhaustion.
* **Resolution**: Edit `apps/studio-android/android/gradle.properties` to increase memory limits:
  ```properties
  org.gradle.jvmargs=-Xmx3072m -XX:MaxPermSize=512m
  ```

Source:
* `apps/studio-android/android/gradle.properties`

### Keystore Signature Mismatch
* **Symptom**: Staged builds fail to install over current packages, displaying "App not installed as package conflicts with an existing package".
* **Resolution**: Keystore configurations differ. Uninstall the previous version from the device completely (`adb uninstall com.chordex.app`) and install the new build to re-establish signature alignment.

### Missing Signing Secrets in CI Pipeline
* **Symptom**: Triggering `android-release.yml` fails at step "Assert Production Signing Secrets".
* **Resolution**: Ensure that the following secrets are configured in GitHub Repository Settings:
  * `ANDROID_KEYSTORE_BASE64`
  * `ANDROID_KEYSTORE_PASSWORD`
  * `ANDROID_KEY_ALIAS`
  * `ANDROID_KEY_PASSWORD`

Source:
* `.github/workflows/android-release.yml`

---

## 2. OTA & PackageInstaller Failures

The native `AppInstallerPlugin` plugin returns specific failure codes from the Android OS.

| Code | Label / OS Reason | Possible Cause | Resolution |
|---|---|---|---|
| **`STATUS_FAILURE_STORAGE (6)`** | Storage Full | Not enough free space to cache or expand the update APK. | Clean system temporary cache or delete media files. |
| **`STATUS_FAILURE_CONFLICT (5)`**| Signature Conflict | The downloaded APK was signed with a different key certificate. | Verify the CI signing key variables or trigger clean reinstalls. |
| **`STATUS_FAILURE_INCOMPATIBLE`**| Version Low / Incompatible | The target APK's `versionCode` is lower than the active code. | Ensure that target release metadata is correct. |

Source:
* `apps/studio-android/android/app/src/main/java/com/chordex/app/InstallReceiver.java`
* `packages/studio-core/src/lib/otaUpdate.ts`

### Download Session Timeouts
* **Symptom**: The updater remains stuck in the `downloading` state and then transitions to `failed` with network errors.
* **Resolution**: Verify that the remote package asset URL (`apkUrl` inside `app-release.json`) resolves correctly in external browsers. If using GitHub Releases, ensure the repository release status is set to `Public`.

---

## 3. Firebase & Hosting Synchronization Blocks

### Firebase Firestore Permission Errors
* **Symptom**: Database calls fail with `FirebaseError: [code=permission-denied]: Missing or insufficient permissions`.
* **Resolution**: Verify that the user authentication credentials are valid. Ensure the document path matches permissions mapped in `firestore.rules`.

Source:
* `firestore.rules`

### CDN Metadata Propagation Delay
* **Symptom**: Triggering a new release succeeds, but clients continue checking and fetching old version configurations.
* **Resolution**: Clear local client application caches or decrease metadata CDN Cache-Control lifetimes inside `firebase.json`:
  ```json
  "headers": [
    {
      "source": "/@(version.json|app-release.json)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store, no-cache, must-revalidate, max-age=0" }
      ]
    }
  ]
  ```

Source:
* `firebase.json`
