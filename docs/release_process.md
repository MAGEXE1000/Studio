# Chordex Studio — Release Process

This document defines the release pipeline, git commit naming rules, and verification criteria for deploying updates.

---

## 1. Versioning Protocol

Chordex Studio enforces version parameters:

* **`versionCode`**: Must be incremented by exactly `+1` on each release (e.g. from `183` to `184`). Reusing codes is strictly forbidden.
* **`versionName`**: Uses semantic naming conventions (`Major.Minor.Patch`, e.g. `3.7.56`). Matches the git release tags.
* **Sync Configuration**: Bumping the native build configurations inside `apps/studio-android/android/app/build.gradle` is synced automatically to `packages/studio-core/src/lib/appVersion.ts` using the version script:
  ```bash
  node scripts/sync-version.mjs
  ```

Source:
* `apps/studio-android/android/app/build.gradle`
* `apps/studio-android/scripts/sync-version.mjs`

---

## 2. Git Workflow & Commit Rules

### Explicit Staging Only
* Never use `git add .` or `git add -A`.
* Stage target files explicitly using their path:
  ```bash
  git add packages/ui-shared/src/components/DevToolsDashboard.tsx
  ```

### Commit Formatting
Commits must conform to Semantic Commits specifications:
* `feat(ui)`: New user interface features.
* `fix(ota)`: Corrections to updater logic.
* `refactor(core)`: Code cleanups, performance tuning, or hooks refactoring.
* `chore(build)`: Build script edits, dependency bumps, or config changes.

*Example*: `feat(ui): modernize Updater Diagnostics dashboard with Material 3 Google Stitch style layout`

---

## 3. Deployment Pipeline (GitHub Actions)

Deployments are manually triggered via the GitHub Actions user interface using the `workflow_dispatch` event handler:

```
┌──────────────────┐       ┌────────────────────┐       ┌────────────────────┐
│ Trigger UI Build ├──────>│  Trigger Workflow  ├──────>│ Compile & Assemble │
│ (inputs: v_name) │       │(android-release.yml)│      │    Signed APKs     │
└──────────────────┘       └─────────┬──────────┘       └─────────┬──────────┘
                                     │                            │
                                     ▼                            ▼
                           ┌────────────────────┐       ┌────────────────────┐
                           │Publish GitHub Release│      │ Deploy Metadata to │
                           │   with APK & SHA   │       │  Firebase Hosting  │
                           └────────────────────┘       └────────────────────┘
```

### Steps
1. **Trigger**: Navigate to Actions on GitHub, select **Android Release Pipeline**, and click **Run workflow**. Fill in the required inputs: `version_name`, `version_code`, and optional `note`.
2. **Build Stage**: The runner launches `android-release.yml`, executing:
   * Linters and unit testing suites.
   * Compiles the React distribution bundles.
   * Decodes base64 keystore credentials and compiles the release APK.
3. **GitHub Release Stage**: Publishes a new release tag containing:
   * Compiled signed APK (`studio-[version_name].apk`).
   * Integrity checksum signature (`studio-[version_name].sha256`).
4. **Hosting Distribution Stage**: Deploys the latest metadata files (`version.json` and `app-release.json`) directly to Firebase Hosting.

Source:
* `.github/workflows/android-release.yml`
* `.github/workflows/release.yml`

---

## 4. Verification Checklists

Before finalizing a release, complete the following verification steps:

* [ ] **Public Metadata Verification**: Fetch metadata parameters:
  * URL: `https://studio-30f44.web.app/version.json` -> verify version matches the tag.
  * URL: `https://studio-30f44.web.app/app-release.json` -> verify `apkUrl`, `sha256`, and `versionCode` are correct.
* [ ] **Updater Auto-Detect**: Launch an older app version and verify that it detects the new version, downloads it, and launches the install prompt.
* [ ] **Regression Verification**: Ensure that offline database synchronization and backing tracks work correctly post-install.

Source:
* `.github/workflows/android-release.yml`
* `packages/studio-core/src/lib/otaUpdate.ts`
