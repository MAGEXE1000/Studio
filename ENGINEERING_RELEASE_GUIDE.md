# Studio Engineering Release Guide

This document is the authoritative guide to the Studio Release Infrastructure, Governance Layer, diagnostic tooling, architecture rules, and release workflows.

---

## Release Governance Layer & Architecture Lock

The Release Governance Layer enforces complete structural and policy invariants. Future contributors cannot bypass or duplicate release architecture:

```
                  ┌─────────────────────────────────────┐
                  │    GitHub Release (Source of Truth) │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │          Release Assets             │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │    APK Integrity & Signatures       │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │   Firebase Metadata Cross-Check     │
                  └─────────────────────────────────────┘
```

### Governance Rules
1. **Single Source Governance**: Exactly one version definition exists in `packages/studio-core/src/lib/startup/appVersion.ts` (`NATIVE_VERSION`).
2. **Orchestrator Governance**: `apps/studio-android/scripts/release-firebase.mjs` is the single official orchestration entry point for application publication.
3. **Publication Path Isolation**: Direct creation of GitHub Releases, Git tags, APK uploads, or Firebase Hosting deployments outside `release-firebase.mjs` is strictly forbidden.
4. **Title Naming Governance**: GitHub Release titles MUST equal version numbers ONLY (e.g. `4.3.72`, `5.0.0`). Prefixes (`Release 4.3.72`, `Version 4.3.72`) or brand names (`Studio`, `Livex`) are strictly rejected.
5. **Immutability Governance**: Published releases, tags, and binaries are permanent and immutable.

---

## Subsystem Inventory

- `apps/studio-android/scripts/release/`: Canonical release utilities (GitHub API, Firebase fetcher, asset discovery, diagnostics, manifest, failure reporter).
- `apps/studio-android/scripts/releaseDoctor/`: Ecosystem health checker (`pnpm release:doctor`).
- `apps/studio-android/scripts/releaseDryRun/`: Pre-publication dry run engine (`pnpm release:dry-run`).
- `apps/studio-android/scripts/releaseTimeline/`: Historical release alignment viewer (`pnpm release:timeline`).
- `apps/studio-android/scripts/releaseLint/`: Architecture linter (`pnpm release:lint`).
- `apps/studio-android/scripts/releaseAudit/`: Governance auditor (`pnpm release:audit`).

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

---

## Future Extension Rules

Future release tools MUST:
1. Re-use existing `apps/studio-android/scripts/release/` ES modules.
2. Route all publication calls exclusively through `release-firebase.mjs`.
3. Pass `pnpm release:lint` and `pnpm release:audit` before committing.
