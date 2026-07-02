# Chordex Studio — Known Issues

This document tracks identified bugs, operational constraints, and active workarounds.

---

## 1. Android Clipboard Character Limit Truncation

* **Severity**: Low
* **Affected Modules**: DevTools Dashboard, Diagnostics Report, Native `AppInstallerPlugin` plugin.
* **Problem**: Passing very large diagnostic strings (such as consolidated JS and native logs exceeding 1MB in text size) directly to the Android Clipboard Manager can fail silently or crash the WebView process.
* **Possible Cause**: The Android OS enforces strict Transactional IPC buffer size limits (commonly capped at 1MB) for clipboard paste events.
* **Workaround / Mitigation**: The UI text copying interface intercepts string payloads larger than `400,000` characters, truncating the top portion of the trace and prepending a warning header message.
  ```typescript
  if (text.length > 400000) {
    textToCopy = text.substring(text.length - 400000);
    textToCopy = `[WARNING: ...]` + textToCopy;
  }
  ```

Source:
* `packages/ui-shared/src/components/DevToolsDashboard.tsx`

---

## 2. Supabase Synchronization propagation delay on low-bandwidth networks

* **Severity**: Medium
* **Affected Modules**: Core sync engine (`packages/studio-core/src/lib/syncEngine.ts`), DB client.
* **Problem**: High-concurrency database updates (such as writing multiple chords sequencer templates in quick succession) can suffer from sync delay on slow mobile networks.
* **Possible Cause**: Concurrent data sync requests queue up in memory until network interfaces clear.
* **Workaround / Mitigation**: The core sync queue serializes requests using locks, retrying database transactions with exponential backoffs rather than overwhelming the socket.

Source:
* `packages/studio-core/src/lib/syncEngine.ts`
* `packages/studio-core/src/lib/sync.ts`

---

## 3. WebView CSS Safe Area Fallback on Legacy Android SDKs

* **Severity**: Low
* **Affected Modules**: `packages/ui-android`, layout margins.
* **Problem**: Certain older Android versions (SDK < 26) running legacy system WebViews fail to parse CSS `env(safe-area-inset-bottom)` properties.
* **Possible Cause**: System WebView engines lack complete safe-area viewport mapping support.
* **Workaround / Mitigation**: Layout containers include a fallback calculation value using `96px` system offset if the safe-area CSS variable is unset:
  ```css
  padding-bottom: calc(var(--content-bottom-pad, 96px) + 20px);
  ```

Source:
* `packages/ui-shared/src/components/DevToolsDashboard.tsx`
