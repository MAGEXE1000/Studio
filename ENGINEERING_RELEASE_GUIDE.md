# Studio Engineering Release Guide

This document is the authoritative guide to the Studio Release Infrastructure, Release State Machine, Execution Modes, diagnostic tooling, and release workflows.

---

## Release State Machine Topology

The release subsystem operates as a deterministic Release State Machine with strict mode separation:

```
                      ┌───────────────────────────┐
                      │    INITIAL AUDIT          │
                      └─────────────┬─────────────┘
                                    │
                         ┌──────────┴──────────┐
                         ▼                     ▼
              ┌────────────────────┐ ┌────────────────────┐
              │ MODE 1: NORMAL     │ │ MODE 2: RECOVERY   │
              │ (Zero Tolerance)   │ │ (--repair / env)   │
              └──────────┬─────────┘ └──────────┬─────────┘
                         │                      │
                   ┌─────┴─────┐          ┌─────┴─────┐
                   ▼           ▼          ▼           ▼
              ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
              │ READY   │ │ BLOCKED │ │ REPAIR  │ │ REPORT  │
              └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

### Execution Modes
1. **MODE 1: NORMAL RELEASE (default)**: Zero-tolerance validation. If ANY repository inconsistency (missing release tag, missing APK asset, metadata mismatch) is detected, execution stops immediately with status `BLOCKED` (exit code 1). Silent recovery or implicit fallbacks are strictly forbidden.
2. **MODE 2: RECOVERY MODE (`RECOVERY_MODE=true` or `--repair`)**: Only executes when explicitly requested by a developer or CI repair workflow. Audits inconsistency, performs repairs or metadata alignment, and generates `release_recovery_report.md`.

---

## State Machine Inventory

- **States**: `CONSISTENT`, `FIRST_RELEASE`, `INTERRUPTED_RELEASE`, `PARTIAL_PUBLICATION`, `ROLLBACK_REQUIRED`, `MISSING_RELEASE`, `MISSING_TAG`, `MISSING_APK`, `METADATA_MISMATCH`, `SIGNATURE_MISMATCH`, `READY`, `BLOCKED`, `RECOVERY_REQUIRED`.
- **Version Synchronization Table**: Standardized 15-component verification matrix (`appVersion.ts`, `Gradle`, `Git Tag`, `GitHub Release`, `APK`, `SHA-256`, `version.json`, `app-release.json`, `Firebase`, `OTA`, `Updater`, `Manifest`, `Doctor`, `Audit`, `Lint`).
- **Reports**:
  - `release-doctor.html` — Interactive HTML report for Release Doctor checks.
  - `release_failure_report.md` — Failure report generated on dry-run or doctor blocks.
  - `release_recovery_report.md` — Recovery report generated when Recovery Mode repairs an inconsistency.

---

## Task Classification Workflows

Every task MUST be classified before execution according to `RELEASE_POLICY.md`:

### 1. Engineering Release
- **Purpose**: Internal repository maintenance (dependencies, Node.js, scripts, CI/CD, documentation, tooling, refactoring, lint, typecheck).
- **Forbidden Operations**:
  - NEVER bump `versionName` or `versionCode`.
  - NEVER modify `version.json`, `app-release.json`, or OTA metadata.
  - NEVER create Git tags or GitHub Releases.
  - NEVER execute the Release Pipeline.
- **Workflow**: `Commit` -> `Push to main` -> `Final Engineering Report`.

### 2. Application Release
- **Purpose**: Shipped application updates (features, bug fixes, UI, native Android code).
- **Required Operations**:
  - Requires version bump, versionCode bump, Release Pipeline execution, APK publication, OTA/Firebase validation, Release Doctor, and Dry Run **ONLY IF EXPLICITLY REQUESTED BY USER**.

### 3. Mixed Release
- **Rules**:
  - If a task contains BOTH Engineering and Application changes, STOP immediately and ask the user to choose an execution strategy (`Engineering only`, `Application only`, or `Engineering first -> Application second`).
