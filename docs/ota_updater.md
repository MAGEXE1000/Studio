# Chordex Studio — OTA Updater Architecture

This document describes the design of the Over-the-Air (OTA) updater, state machine definitions, binary verification pipelines, and failure recovery behaviors.

---

## 1. Core State Machine & Code Layout

The updater transitions through a sequence of states managed in `packages/studio-core/src/lib/otaUpdate.ts` and its helper modules:

```
┌──────┐      ┌───────────┐      ┌───────────────┐      ┌─────────────┐
│ Idle ├─────>│ Checking  ├─────>│UpdateAvailable├─────>│ Downloading │
└──────┘      └─────┬─────┘      └───────┬───────┘      └──────┬──────┘
                    │                    │                     │
                    ▼                    ▼                     ▼
              ┌───────────┐      ┌───────────────┐      ┌─────────────┐
              │No Update  │      │VersionCode Low│      │Verifying SHA│
              └───────────┘      └───────────────┘      └──────┬──────┘
                                                               │
                                                               ▼
              ┌───────────┐      ┌───────────────┐      ┌─────────────┐
              │  Failed   │<─────┤ ReadyInstall  │<─────│VerifyingElig│
              └───────────┘      └───────────────┘      └─────────────┘
```

### State Definitions
* **`idle`**: Neutral state. No active updates.
* **`checking`**: Polling Hosting for `app-release.json` manifest.
* **`update_available`**: Found higher version on remote servers.
* **`downloading`**: Streaming binary from URL into native local directory.
* **`verifying_sha`**: Computing SHA-256 hash on target file and checking against remote JSON manifest.
* **`verifying_eligibility`**: Validating cert signatures and checking minSdk versions.
* **`ready_to_install`**: Binary committed to local storage; waiting for PackageInstaller session to open.
* **`installing`**: Streaming bytes to Android PackageInstaller session.
* **`installed`**: Session successfully committed. App reboots.
* **`failed`**: Installation/download failed. Registers error code to metrics logs.

Source:
* `packages/studio-core/src/lib/otaUpdate.ts`
* `packages/studio-core/src/lib/updater/installer.ts`

---

## 2. File Organization & Architecture

The updater is modularly split across multiple helper modules in `packages/studio-core/src/lib/updater/`:
* **`installer.ts`**: Coordinates native Capacitor calls to initialize PackageInstaller sessions, write APK binary chunks, and trigger the commit step.
* **`downloadManager.ts`**: Interfaces with `@capacitor/filesystem` to cache APK downloads in the application sandbox.
* **`cacheManager.ts`**: Inspects and purges obsolete APK binaries.
* **`diagnostics.ts`**: Summarizes system diagnostics reports, log traces, and metadata snapshots.
* **`recovery.ts`**: Implements state restoration and fallback options.

### Watchdogs & Helpers
* **`capgoUpdater.ts`**: An early native initialization listener that executes outside React's render loop immediately upon app boot. It reads local APK details to check for uncommitted installations and cleans up crashed sessions.
* **`InstallReceiver.java`**: A native Android broadcast receiver that captures completion intents from the Android OS PackageInstaller daemon.
* **`OtaCheckWorker.java`**: Android background worker scheduling system checks and alerts.

Source:
* `packages/studio-core/src/lib/capgoUpdater.ts`
* `packages/studio-core/src/lib/updater/`
* `apps/studio-android/android/app/src/main/java/com/chordex/app/InstallReceiver.java`
* `apps/studio-android/android/app/src/main/java/com/chordex/app/OtaCheckWorker.java`

---

## 3. Integrity Verification Pipeline

Before streaming any update to the OS, the updater executes two validation checks:

1. **SHA-256 Integrity Verification**: 
   Computes the SHA-256 hash of the downloaded file on local disk and matches it against the expected hash in the JSON manifest. If they mismatch, the update is deleted and the updater transitions to `failed`.
2. **Signature & Version Compatibility Verification**:
   The native `AppInstallerPlugin` plugin parses the APK manifest to verify:
   * **Version Code Eligibility**: Assures target versionCode is higher than currently installed.
   * **Signature Alignment**: Verifies that the APK's certificate signatures match the active app certificate. If they differ, the install fails immediately, protecting users from package spoofing.

Source:
* `packages/studio-core/src/lib/updater/downloadManager.ts`
* `packages/studio-core/src/lib/updater/installer.ts`

---

## 4. Failure Handling & Recovery Mode

To prevent "bootloop" or update deadlock scenarios, the updater incorporates a recovery strategy:

* **Diagnostics Recovery Mode**: When critical download steps time out or signature validations fail on boot, the updater calls `updateGlobalState({ consecutiveFailures: 5, recoveryMode: true })`.
* **Safe-State Restoration**: Entering recovery mode deletes cached update items, sets an active fallback registry provider, and displays the diagnostics panel to let users inspect logs and recheck updates manually.

Source:
* `packages/studio-core/src/lib/otaUpdate.ts`
* `packages/studio-core/src/lib/updater/recovery.ts`

---

## 5. Metadata Distribution & Proxies

OTA version and release metadata are served from Firebase Hosting. The web portal (Netlify) proxies these requests back to Firebase to act as a mirror:

* Netlify `/version.json` -> proxies to `https://studio-30f44.web.app/version.json`
* Netlify `/app-release.json` -> proxies to `https://studio-30f44.web.app/app-release.json`
* Netlify `/apk/*` -> proxies to `https://studio-30f44.web.app/apk/:splat`

Source:
* `netlify.toml`
* `firebase.json`
