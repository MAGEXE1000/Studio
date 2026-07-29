# Debugging Guide

> **Purpose**: Structured guide for diagnosing common issues in Studio.  
> **Important**: Check `docs/bugs/` for known bugs before investigating.

---

## Before You Debug

1. **Read `docs/bugs/README.md`** — Check if the bug is already documented
2. **Read the relevant architecture doc** in `docs/architecture/`
3. **Check `FEATURE_MAP.md`** to identify which files own the behavior
4. **Check `knowledge/lessons_learned.md`** for past debugging insights

---

## Sync Failures

### Symptoms
- Data not syncing across devices
- Sync state stuck on "syncing"
- "Sync error" displayed in settings

### Files to Inspect
1. `packages/studio-core/src/lib/sync.ts` → actual sync module
2. `packages/studio-core/src/lib/syncBackends/` — provider-specific logic
3. `packages/studio-core/src/lib/auth.ts` — auth state affects sync attachment

### Common Causes
- **Auth epoch mismatch**: Sign-out/sign-in during active sync causes epoch counter to invalidate in-flight runs
- **Firestore timeout**: Individual operations have a 6-second timeout; overall run has a 10-second watchdog
- **Hash comparison skip**: If local data hash matches remote, the sync is (correctly) skipped
- **Queue depth**: Only 1 pending followup run is queued; concurrent triggers share the in-flight promise

### Debug Steps
1. Open Dev Tools Dashboard (`DevToolsDashboard.tsx`) → check sync logs
2. Verify auth state: Is the user actually signed in?
3. Check the sync state machine: `idle` → `syncing` → `success`/`error`
4. If stuck in `syncing`, the watchdog should time out after 10 seconds

---

## OTA Updater Stuck

### Symptoms
- Update banner shows but no progress
- Download stuck at a percentage
- Install never triggers

### Files to Inspect
1. `packages/studio-core/src/lib/updater/pipeline.ts` — orchestrator
2. `packages/studio-core/src/lib/updater/stateMachine.ts` — state + transitions
3. `packages/studio-core/src/lib/updater/downloadManager.ts` — download progress
4. `packages/studio-core/src/lib/updater/diagnostics.ts` — diagnostic collection

### Common Causes
- **State machine stuck**: Transient states have watchdog timeouts — check if watchdog is firing
- **Download failure**: Network issues, CORS, or Firebase Hosting misconfiguration
- **SHA-256 mismatch**: Downloaded APK fails integrity check
- **PackageInstaller not launching**: Android intent permissions issue

### Debug Steps
1. Open updater diagnostics: `UpdateDiagnosticsSheet.tsx`
2. Check flight recorder: `packages/studio-core/src/lib/updater/flightRecorder.ts`
3. Verify remote `version.json` is accessible and contains correct metadata
4. Check `releaseMetadata.ts` for parsing errors

---

## Navigation Bugs

### Symptoms
- Wrong panel displayed
- Back button doesn't work
- Transition animation stuck
- Duplicate routes in history

### Files to Inspect
1. `packages/studio-core/src/lib/navigation/NavigationDispatcher.ts` — main API
2. `packages/studio-core/src/lib/navigation/validation.ts` — route validation
3. `packages/studio-core/src/lib/navigation/useNavigationStore.ts` — state
4. `packages/ui-shared/src/navigation/SharedNavigationContainer.tsx` — panel rendering

### Common Causes
- **Transition lock**: `lockTransition()` sets a 300ms auto-release. If a transition fires during the lock, it's queued
- **Duplicate guard**: `NavigationDispatcher.push()` guards against pushing identical routes
- **Recursion detection**: `detectRecursion()` in `validation.ts` prevents A→B→A cycles
- **Gesture conflict**: `GestureDispatcher` and `BackDispatcher` can conflict

### Debug Steps
1. Open Dev Tools Dashboard → Navigation tab to see route history
2. Check `useNavigationStore` state: `history`, `isTransitioning`, `gestureState`
3. Verify the route is valid via `normalizeAndValidateRoute()`
4. Check for competing `useBackHandler` registrations

---

## Theme / Visual Glitches

### Symptoms
- Wrong colors displayed
- Theme not applying after change
- AMOLED mode not activating

### Files to Inspect
1. `packages/studio-core/src/lib/themeEngine.ts` → actual theme module
2. `packages/studio-core/src/lib/themeTransitionEngine.ts`
3. `packages/studio-core/src/lib/designTokens.ts`
4. Platform CSS: `apps/studio-web/src/index.css` or `apps/studio-android/src/index.css`

### Common Causes
- **CSS custom property not applied**: `applyThemeTokens()` may not have been called
- **Per-app override conflict**: `settings.perApp[appMode]` overrides can mask global theme
- **Transition engine jank**: See `docs/bugs/theme-transition-jank.md`

---

## Preferences Not Persisting

### Symptoms
- Settings reset on app restart
- Custom chords disappear

### Files to Inspect
1. `packages/studio-core/src/lib/utilities/security.ts` — `secureWriteLocal` / `secureReadLocal`
2. `packages/studio-core/src/store/useChordStore.ts` — persist middleware config
3. `packages/studio-core/src/lib/nativePrefs.ts` — Capacitor Preferences (Android)

### Common Causes
- **Encryption/decryption error**: `hexToBytes()` or `bytesToHex()` bug corrupts data
- **localStorage full**: Browser storage quota exceeded
- **Deserialization failure**: `JSON.parse` fails on corrupted data → Zustand falls back to defaults
- **See**: The `v4.3.04` fix for the `hexToBytes()` index calculation bug

---

## Audio Issues

### Symptoms
- No sound playing
- Drum samples not loading
- Audio glitches/pops

### Files to Inspect
1. `packages/studio-core/src/lib/drumAudio.ts` → actual audio engine
2. `packages/studio-core/src/lib/audioContextOptions.ts` → actual AudioContext factory
3. `packages/studio-core/src/lib/assetCache.ts` → actual asset URL resolver

### Common Causes
- **Browser autoplay policy**: AudioContext suspended until user gesture
- **Sample not loaded**: `assetCache` URL resolution failure
- **WebView audio**: Android WebView has different audio behavior than desktop browsers

---

## Build Failures

### Symptoms
- TypeScript compilation errors
- Platform scope violations
- Bundle separation failures

### Debug Steps
1. **TypeScript**: `pnpm typecheck:web` and `pnpm typecheck:android`
2. **Scope**: `pnpm scope:check` — identifies cross-platform import violations
3. **Bundle**: `node scripts/verify-bundle-separation.mjs` — checks Android-only code in web bundle
4. **Versions**: `node scripts/verify-versions-consistency.mjs` — checks version alignment

---

## General Debugging Tools

| Tool | Access |
|------|--------|
| Dev Tools Dashboard | Toggle in app settings or keyboard shortcut |
| Navigation inspector | Dev Tools → Navigation tab |
| Performance profiler | Dev Tools → Performance tab |
| Updater diagnostics | `UpdateDiagnosticsSheet` (accessible from update UI) |
| Sync state inspector | Dev Tools → Sync tab |
| Flight recorder | `studio-core/src/lib/updater/flightRecorder.ts` |
| Activity logger | `studio-core/src/lib/activityLogger.ts` |
