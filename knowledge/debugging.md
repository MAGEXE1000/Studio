# Reusable Knowledge — Diagnostics & Debugging

This document defines debugging workflows, inspect tools, and logger parameters.

---

## 1. Remote inspect WebView
- **inspect Port**: Developers can connect chrome remote developer tools to Android emulators or devices via `chrome://inspect` to view console outputs, network requests, and performance logs in the WebView context.

Source:
* [debugging.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/debugging.md#L30-L50)

---

## 2. Diagnostics UI Overlay
- **Trigger**: Tap the status indicators under Settings > Account or launch the DevTools Panel (`ui-shared/src/components/DevToolsDashboard.tsx`) to show diagnostics logs:
  - `activeSyncProvider`
  - `supabaseClientReady`
  - `realtimeConnected`
  - `firebaseAuthBridgeReady`

Source:
* [supabaseRealtime.ts](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/studio-core/src/lib/syncBackends/supabaseRealtime.ts#L41-L65)
