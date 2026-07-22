# Studio (Livex) Release Pipeline Infrastructure Contract

Version: 1.0.0
Authoritative Specification for Monorepo Release Automation

---

## 1. Overview & Architectural Philosophy

The Studio Release Pipeline is a **Deterministic 4-Stage State Machine** engineered for zero-trust production release delivery. Once triggered, the pipeline enforces absolute immutability, single-source-of-truth versioning, and zero-fallback signature verification.

### Core Principles
1. **Single Source of Truth**: The version is defined exclusively in `packages/studio-core/src/lib/startup/appVersion.ts`. No build script or workflow stage may auto-increment or mutate versions during execution.
2. **Zero Fallback Production Signing**: Fallback to debug keystores or non-production signatures is strictly forbidden. The official production key SHA-256 fingerprint (`900cf259185c81100cda8bb08571fa23552e9789131cf07a8f4056e4d4129206`) is immutable.
3. **Fail-Fast Verification**: If any manifest, artifact, checksum, signature, or version differs from expected state, execution halts immediately with explicit diagnostic output.
4. **State Machine Immutability**: Each stage produces immutable outputs consumed by downstream stages. No stage re-executes or modifies preceding stage outputs.

---

## 2. Pipeline State Machine Stages

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 1: RESOLVED_VERSION & PREFLIGHT                                           │
│ Job: 1. Preflight & Fail-Fast Validation                                         │
│ Script: scripts/verify-versions-consistency.mjs, scripts/validate-release-changelog.mjs │
│ Inputs: appVersion.ts, package.json (web/android), build.gradle, CHANGELOG.md  │
│ Output: Single Source Version (RESOLVED_VERSION), Version Code (VERSION_CODE)   │
│ Invariant: All 11 manifests must match RESOLVED_VERSION exactly.                │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 2: BUILT_APK & SIGNED_APK                                                 │
│ Job: 2. Build, Package & Sign                                                   │
│ Script: Gradle assembleRelease, scripts/generate-release-verification-report.mjs│
│ Inputs: RESOLVED_VERSION, Production Keystore Secret                             │
│ Output: app-release.apk, app-release.apk.sha256, release-verification-report.json│
│ Invariant: APK signature fingerprint must match official production key.        │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 3: VERIFIED_CONTRACT                                                      │
│ Job: 3. Signing & Contract Verification                                         │
│ Script: scripts/verify-release-signatures.mjs                                   │
│ Inputs: Downloaded release verification report & artifact manifests             │
│ Output: VERIFIED_CONTRACT status assertion                                       │
│ Invariant: Status must equal VERIFIED_PRODUCTION.                               │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 4: PUBLISHED_RELEASE & DEPLOYED_FIREBASE                                  │
│ Job: 4. Publish, Deploy & Report                                                │
│ Script: gh release create, firebase deploy --only hosting                       │
│ Inputs: Verified APK, Verified Manifests, Firebase Credentials                  │
│ Output: GitHub Release vX.Y.Z, Live Firebase Metadata, release-health.json      │
│ Invariant: Live Firebase CDN metadata version must match RESOLVED_VERSION.      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Responsibilities & Single Sources of Truth

| Responsibility | Authoritative Script / Source | Forbidden Behavior |
| :--- | :--- | :--- |
| **Version Resolution** | `packages/studio-core/src/lib/startup/appVersion.ts` | Auto-incrementing patch version inside build scripts |
| **Version Update CLI** | `scripts/version-manager.mjs` | Manual or ad-hoc edit of individual version files |
| **Version Alignment Assertion** | `scripts/verify-versions-consistency.mjs` | Suppressing version mismatch errors |
| **Changelog Validation** | `scripts/validate-release-changelog.mjs` | Releasing without a matching `# Version X.Y.Z` section |
| **Signature Verification** | `scripts/verify-release-signatures.mjs` | Fallback to debug keys or skipping check if `apksigner` is missing |
| **Verification & Manifest Reports** | `scripts/generate-release-verification-report.mjs` | Generating multiple inconsistent manifest JSON schemas |
| **Release Orchestration** | `apps/studio-android/scripts/release-firebase.mjs` | Altering repository files during build execution |

---

## 4. Forbidden Pipeline Behaviors

1. **NO DYNAMIC VERSION BUMPING**: No pipeline job or script may auto-increment `NATIVE_VERSION` or `versionCode` during execution.
2. **NO HARDCODED OVERRIDES**: No pipeline job may bypass signature check using environment flags like `SKIP_SIGNATURE_CHECK=true`.
3. **NO PREDEPLOY SIGNATURE HOOKS IN FIREBASE.JSON**: Firebase Hosting deployment must remain strictly isolated to deploying static metadata artifacts.
4. **NO UNVERIFIED ASSET UPLOADS**: No APK or SHA-256 asset may be uploaded to GitHub Releases without prior verification by `scripts/verify-release-signatures.mjs`.

---

## 5. Failure Modes & Recovery Runbook

| Failure Mode | Root Cause | Recovery Procedure |
| :--- | :--- | :--- |
| `VERSION CONSISTENCY FAILURE` | A manifest or `package.json` file contains a different version | Run `node scripts/version-manager.mjs android --name X.Y.Z --code CODE` and `node apps/studio-android/scripts/sync-version.mjs`. |
| `CHANGELOG VALIDATION FAILURE` | `CHANGELOG.md` does not contain `# Version X.Y.Z` section | Add a formatted `# Version X.Y.Z` header with bullet points in `CHANGELOG.md`. |
| `CRITICAL SECURITY FAILURE` | APK was signed with debug key or wrong certificate | Ensure `ANDROID_KEYSTORE_BASE64` secret in GitHub Actions matches production key. |
| `SHA256 CHECKSUM MISSING` | Gradle build completed but `.sha256` file was not created | Ensure `release-firebase.mjs` finishes Step 6 before verification runs. |
| `DEPLOYED VERSION MISMATCH` | Live Firebase Hosting CDN returns a version different from `RESOLVED_VERSION` | Purge Firebase Hosting cache or rerun Job 4 to re-deploy metadata. |

---

## 6. Contract Invariants

- **Invariant A**: `versionCode` MUST equal `major * 10000 + minor * 100 + patch`.
- **Invariant B**: Production signature SHA-256 fingerprint MUST equal `900cf259185c81100cda8bb08571fa23552e9789131cf07a8f4056e4d4129206`.
- **Invariant C**: `release-state.json` and `release-health.json` MUST be generated for every release execution.
