# Studio Engineering Release Guide

This document is the authoritative guide to the Studio Release Infrastructure, diagnostic tooling, and release workflows.

---

## Task Classification Workflows

Every task MUST be classified before execution according to `RELEASE_POLICY.md`:

### 1. Engineering Release
- **Purpose**: Internal repository maintenance (dependencies, Node.js, scripts, CI/CD, documentation, tooling, refactoring, lint, typecheck).
- **Rules**:
  - NEVER bump `versionName` or `versionCode`.
  - NEVER modify `version.json`, `app-release.json`, or OTA metadata.
  - NEVER create Git tags or GitHub Releases.
  - NEVER execute the Release Pipeline.
- **Workflow**: `Commit` -> `Push to main` -> `Final Engineering Report`.

### 2. Application Release
- **Purpose**: Shipped application updates (features, bug fixes, UI, native Android code).
- **Rules**:
  - May bump version, execute Release Pipeline, create GitHub Release and Git tags **ONLY IF EXPLICITLY REQUESTED BY USER**.
- **Workflow**: `Commit` -> `Push` -> `Version bump` -> `Release Pipeline` -> `GitHub Release` -> `Firebase metadata`.

### 3. Mixed Request
- **Rules**:
  - If a task contains BOTH Engineering and Application changes, STOP immediately and ask the user to choose an execution strategy (`Engineering only`, `Application only`, or `Engineering first -> Application second`).

---

## Release Tooling & Diagnostics

### 1. Release Manifest (`release-manifest.json`)
The single source of truth manifest generated dynamically by release tooling containing:
- `version`, `versionCode`, `githubTag`, `githubReleaseTitle`, `apkFilename`, `apkSha256`, `buildTimestamp`, `commit`, `firebaseVersion`, `otaVersion`.

### 2. Release Doctor (`pnpm release:doctor`)
Validates complete release ecosystem health across 6 core checks:
- **GitHub Release**: Validates release existence, asset count, visibility, and title naming policy compliance.
- **Git Tag**: Validates Git tag presence locally, on remote `origin`, and via GitHub API.
- **APK**: Validates compiled release APK presence, size (>1MB), and integrity.
- **Firebase**: Validates Firebase Hosting metadata (`app-release.json`) version & versionCode consistency.
- **OTA**: Validates `appVersion.ts` `NATIVE_VERSION` definition.
- **Signature**: Validates production signing certificate fingerprint (`900cf259185c81100cda8bb08571fa23552e9789131cf07a8f4056e4d4129206`).

Generates both console ASCII output and `release-doctor.html` for browser viewing.

### 3. Release Dry Run (`pnpm release:dry-run`)
Executes pre-publication dry run validations WITHOUT publishing anything:
- Verifies existence of required artifacts (`release-notes.md`, `public/version.json`, `firebase-public/app-release.json`).
- Enforces release immutability (ensuring target version is unreleased on GitHub).
- Executes full Release Doctor suite.
- Outputs `READY TO RELEASE` or `BLOCKED`. Generates `release_failure_report.md` on block.

### 4. Release Timeline (`pnpm release:timeline`)
Outputs historical release timeline showing versions, publication dates, target commits, Firebase alignment, and OTA status.

### 5. Failure Reports (`release_failure_report.md`)
Automatically written whenever validation or dry-run fails, providing Root Cause, Evidence, Suggested Fix, Next Command, Priority, and Expected Resolution.

---

## Release Invariants & Rules

1. **Title Naming Policy**: GitHub Release titles MUST contain ONLY the version number (e.g. `4.3.60`). Titles MUST NEVER include brand names like `Studio` or `Livex`.
2. **Release Immutability Policy**: Published releases are permanent and immutable. Old releases, tags, or binaries must NEVER be edited or overwritten.
3. **Provider Priority Hierarchy**: GitHub queries prioritize `REST API` -> `GraphQL API` -> `GitHub CLI Fallback`.
4. **Staging Policy**: Files MUST be staged explicitly (`git add file1 file2`). `git add .` is strictly forbidden.
