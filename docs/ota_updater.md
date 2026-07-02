# Chordex Studio — OTA Updater Architecture

This document describes the design of the Over-the-Air (OTA) updater, state transitions, binary verification pipelines, and failure recovery behaviors.

---

## 1. Core State Machine

The updater transitions through a well-defined sequence of states managed by `@workspace/studio-core` in `packages/studio-core/src/lib/otaUpdate.ts`:

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
              │  Failed   │<─────┤ ReadyInstall  │<─────┤   Eligible  │
              └───────────┘      └───────────────┘      └─────────────┘
```

### States
* **`idle`**: Neutral state. No active updates.
* **`checking`**: Polling Hosting for `app-release.json` manifest.
* **`update_available`**: Found higher version on remote servers.
* **`downloading`**: Streaming binary from URL into native local directory.
* **`verifying_sha`**: Computing SHA-256 hash on target file and checking against remote JSON manifest.
* **`eligible`**: Validating cert signatures and checking minSdk versions.
* **`ready_to_install`**: Binary committed to local storage; waiting for PackageInstaller session to open.
* **`installing`**: Streaming bytes to Android PackageInstaller session.
* **`installed`**: Session successfully committed. App reboots.
* **`failed`**: Installation/download failed. Registers error code to metrics logs.

---

## 2. Integrity Verification Pipeline

Before streaming any update to the OS, the updater executes two validation checks:

1. **SHA-256 Integrity Verification**: 
   Computes the SHA-256 hash of the downloaded file on local disk and matches it against the expected hash in the JSON manifest. If they mismatch, the update is deleted and the updater transitions to `failed`.
2. **Signature & Version Compatibility Verification**:
   The native `AppInstaller` plugin parses the APK manifest to verify:
   * **Version Code Eligibility**: Assures target versionCode is higher than currently installed.
   * **Signature Alignment**: Verifies that the APK's certificate signatures match the active app certificate. If they differ, the install fails immediately, protecting users from package spoofing.

---

## 3. Failure Handling & Recovery Mode

To prevent "bootloop" or update deadlock scenarios, the updater incorporates a robust recovery strategy:

* **Consecutive Failures Threshold**: If updates fail 3 times consecutively, the updater increments `consecutiveFailures` in `otaDiagnostics`.
* **Diagnostics Recovery Mode**: Once `consecutiveFailures` reaches 3, the updater activates a safe recovery state:
  * Deletes any corrupted cached updates.
  * Disables optional checks on startup.
  * Prompts users with a specialized diagnostics recovery screen to verify connectivity and system configurations manually.
* **Metadata Fallbacks**: If the cloud host is unreachable, the updater falls back to local storage version configurations and retries after a cooldown.
