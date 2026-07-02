# Chordex Studio — Reusable Engineering Checklists

This document acts as the standardized checklist library for future engineering operations on this repository. Every session must follow the relevant checklist(s) sequentially.

---

## 1. New Feature Checklist (MANDATORY)

- [ ] **1. Read Architecture Docs**: Review `docs/engineering_guide.md`, `docs/ai_workflow.md`, and `docs/architecture.md`.
- [ ] **2. Boundary Audit**: Check platform isolation bounds (Android under `apps/studio-android` and `packages/ui-android`; Web under `apps/studio-web` and `packages/ui-web`).
- [ ] **3. Dry-Run Component Check**: Search `packages/ui-shared/` and `packages/studio-core/` to identify reusable logic, helpers, and hooks. Avoid duplicate implementations.
- [ ] **4. Planning Phase**: Create the implementation plan outlining files to modify, strategies, risks, and validation methods.
- [ ] **5. Implementation Phase**: Write clean, modular code conforming to platform separation.
- [ ] **6. Build Target**: Compile packages using `pnpm build` or `pnpm run build:android:web`.
- [ ] **7. Test Target**: Run target tests using `pnpm run test:web` or `pnpm run test:android`.
- [ ] **8. Regression Testing**: Verify previous app logins, core storage cache items, and audio engines remain fully functional.
- [ ] **9. Document Changes**: Record architectural shifts in `docs/architecture_decisions.md` and update target guides in `docs/`.
- [ ] **10. Version Control**: Stage files explicitly (no `git add .`), write a semantic commit message, and push.

Source:
* `docs/engineering_guide.md`
* `docs/ai_workflow.md`

---

## 2. Bug Fix Checklist (MANDATORY)

- [ ] **1. Evidence Gathering**: Collect console `jsLogs`, native `nativeLogsList`, and transition timelines. Do not start coding.
- [ ] **2. Reconstruct Path**: Trace the exact logic flow and locate the root cause of the bug.
- [ ] **3. Validate Assumptions**: Prove why the bug occurred and verify local storage or API variables. Do not use trial-and-error edits.
- [ ] **4. Design Focused Fix**: Plan a focused, minimal change that targets the root cause directly.
- [ ] **5. Implementation**: Refactor the code core rather than wrapping handlers in conditional guards.
- [ ] **6. Build & Verify**: Compile packages to verify no new compilation or type warnings remain.
- [ ] **7. Regression Testing**: Confirm other modules, layouts, and auth flows are unaffected.
- [ ] **8. Version Control**: Stage target files explicitly, commit, and push.

Source:
* `docs/debugging.md`
* `docs/troubleshooting.md`

---

## 3. Refactor Checklist

- [ ] **1. Identify Scope**: Determine target files and classes to optimize. Keep files under 1000 lines.
- [ ] **2. API Preservation**: Ensure public interfaces, store selectors, and method parameters remain unchanged.
- [ ] **3. Eliminate Duplication**: Consolidate cloned layouts or logic into shared utility files.
- [ ] **4. Extract Nested Nodes**: Move helper render nodes and inline states out of parent rendering functions.
- [ ] **5. Build & Typecheck**: Run `pnpm run typecheck:libs` to verify imports and parameters.
- [ ] **6. Regression Testing**: Test the refactored code across both Android and Web targets.

Source:
* `docs/coding_standards.md`
* `docs/performance.md`

---

## 4. Android Checklist

- [ ] **1. Safe Area Verification**: Verify top and bottom safe-area layouts, checking env variables in the CSS template.
- [ ] **2. System Bar Spacing**: Ensure layout elements do not overflow or overlap behind the status bar or the `96px` bottom nav bar.
- [ ] **3. Touch Targets**: Verify all buttons have a minimum size of `44x44px` and do not intercept scroll drag events.
- [ ] **4. PackageInstaller Hook**: Ensure that update triggers launch session actions and bind `InstallReceiver` correctly.
- [ ] **5. Permissions Registry**: Check that manifest permissions align with native plugin requests.
- [ ] **6. Compilation Check**: Assemble the APK and verify the output using the Android SDK tools.

Source:
* `docs/android.md`
* `docs/ota_updater.md`

---

## 5. Web Checklist

- [ ] **1. Responsive Grid Scaling**: Check layouts at various breakpoints down to mobile dimensions (360dp).
- [ ] **2. Netlify SPA Rules**: Verify redirection paths match rules specified in `netlify.toml`.
- [ ] **3. Browser Compatibility**: Ensure fallback paths (clipboard, local storage) operate when Capacitor plugins are missing.
- [ ] **4. Chunk Size Checks**: Run web builds and check for chunk optimization warnings.

Source:
* `docs/web.md`

---

## 6. OTA Checklist

- [ ] **1. Checksums**: Verify that the calculated SHA-256 matches the manifest expectations.
- [ ] **2. Version Code Bounds**: Ensure the update versionCode is greater than the current active versionCode.
- [ ] **3. Signature Verification**: Confirm that target APK signatures align with the installed package credentials.
- [ ] **4. Log Buffers**: Check that state transitions update `globalOtaState` and print to timeline logs.
- [ ] **5. Recovery Threshold**: Verify that fallback mechanisms register `consecutiveFailures: 5` and trigger diagnostic recovery screens on repeat boot failures.

Source:
* `docs/ota_updater.md`

---

## 7. Release Checklist

- [ ] **1. Increment version parameters**: Update `versionCode` (+1) and `versionName` inside `build.gradle`.
- [ ] **2. Sync versions**: Run `node scripts/sync-version.mjs` to synchronize version files and changelogs.
- [ ] **3. CI Trigger**: Manually execute the release workflow on GitHub Actions using the `workflow_dispatch` interface.
- [ ] **4. CDN Verification**: Fetch public manifests (`version.json`, `app-release.json`) and verify values match the tag release.
- [ ] **5. Verification testing**: Run regression checks on the compiled production APK.

Source:
* `docs/release_process.md`

---

## 8. Documentation Checklist

- [ ] **1. Source Reference**: Ensure important factual sections end with a `Source:` file reference block.
- [ ] **2. ADR Updates**: Log architectural decisions in `docs/architecture_decisions.md` before coding.
- [ ] **3. Mirror Code changes**: Update relevant docs in `docs/` whenever configurations (rules, settings, workflow secrets) mutate.

Source:
* `docs/ai_workflow.md`

---

## 9. Code Review Checklist

- [ ] **1. Strong Types**: Verify that variables and method parameters do not use `any`.
- [ ] **2. Modular scopes**: Check that child elements are not defined inside rendering handlers.
- [ ] **3. Hooks Validation**: Ensure all hooks (`useState`, `useRef`) are called at the component root level.
- [ ] **4. Resource Cleanups**: Verify that cleanups are returned in all `useEffect` registrations.

Source:
* `docs/coding_standards.md`
* `docs/performance.md`

---

## 10. Emergency Recovery Checklist

- [ ] **1. Halt Operations**: Stop all file modifications immediately if two implementation attempts fail.
- [ ] **2. Collect Logs**: Extract terminal logs, package manifests, and transaction buffers.
- [ ] **3. Inspect History**: Compare modifications against previous versions and check ADRs.
- [ ] **4. Request Review**: Open a communication thread and recommend a formal logical audit by **Claude Opus**.
- [ ] **5. Formulate Strategy**: Proceed only after new evidence has been validated.

Source:
* `docs/ai_workflow.md`
* `docs/troubleshooting.md`
