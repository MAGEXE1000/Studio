# Chordex Studio — Testing & Verification Guide

This document defines testing methodologies, automated test commands, manual QA checklists, and platform-specific verification procedures.

---

## 1. Automated Testing Suites

Execute automated validation suites before submitting code for review or deployment.

### Test Commands
* **Type checking**: Validate workspace packages for type accuracy:
  ```bash
  pnpm run typecheck:libs
  ```
* **Web Tests**: Run unit and integration tests for the web target:
  ```bash
  pnpm run test:web
  ```
* **Android Tests**: Run unit tests for the Android target:
  ```bash
  pnpm run test:android
  ```

---

## 2. Platform-Specific Manual QA Checklist

### Android Device Validation
* [ ] **Notch & Status Spacing**: Verify the UI elements do not clip behind status bar notches or camera holes in portrait or landscape orientations.
* [ ] **System Navigation Safe Zone**: Scroll to the bottom of all lists and panels and verify that every action button is fully visible above the system navigation bar.
* [ ] **Back Gestures**: Swipe from the left or right edge of the screen and verify that the page processes back actions correctly without crashing.
* [ ] **PackageInstaller Prompt**: Trigger an APK installation and verify that the OS PackageInstaller prompt launches correctly on top of the web view.
* [ ] **Physical Keyboard Input**: Connect a keyboard or type using the soft-keyboard and verify that the input boxes do not offset the page container layout.

---

## 3. Regression Testing Criteria

To prevent system updates from breaking existing client states, verify:

1. **Auth Session Persistence**: Bumping versions or updating the app must not log users out. The active Firebase/Supabase session token must persist.
2. **Offline Data Preservation**: Cached practice songs, custom sequences, and progress metrics stored in local databases must load successfully post-install.
3. **Audio Playback Stability**: Validate that tuner analyzers, audio recording takes, and backing tracks operate consistently across update installations.

---

## 4. Release Pipeline Verification (Smoke Test)

After running the deployment pipeline:
1. **Fetch CDN Manifests**: Verify that version endpoints resolve correctly:
   * `https://studio-30f44.web.app/version.json`
   * `https://studio-30f44.web.app/app-release.json`
2. **Download & Checksums**: Manually download the APK from the published CDN release and verify that its SHA-256 hash matches the value declared in `app-release.json`.
3. **End-to-End OTA Test**: Install an older build and verify that the in-app updater completes the update flow (check -> download -> verify -> install) seamlessly.
