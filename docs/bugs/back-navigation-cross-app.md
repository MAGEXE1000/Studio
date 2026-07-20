# Back Navigation Cross-App History Leak

## Problem Summary

Pressing the hardware/software Back button from a sub-application's root screen would unexpectedly navigate the user back into a previously visited application or the Hub, instead of stopping at the current app's root.

## Severity

High

## Status

Resolved (v4.2.4)

## Symptoms

- User is in Groovex at the Home screen (root). Pressing Back navigates to Stagex (which they visited earlier) instead of doing nothing or showing an exit confirmation.
- User is in Chordex at the Library screen (root). Pressing Back navigates to the Hub, even though they intended to stay in Chordex.
- Navigation history behaves as a single global stack rather than isolated per-app stacks.

## How to Reproduce

1. Open the Hub.
2. Navigate to Groovex.
3. Navigate within Groovex to a sub-page, then back to Groovex Home.
4. Open the App Switcher, switch to Stagex.
5. Navigate within Stagex to a sub-page, then back to Stagex Main Workspace.
6. Press Back again from the root screen.
7. Observe: the user is unexpectedly navigated back to Groovex Home instead of stopping.

## Expected Behavior

Each sub-application owns its own isolated navigation stack. Once the user reaches the root screen of the current app (e.g., Groovex Home, Chordex Library), Back should stop — it should never pop into another application's history or the Hub.

## Observed Behavior

The navigation system used a single global `history` array. The `isRootRouteOnly()` guard checked `history.length <= 1`, which meant Back was only blocked when the _entire_ history stack (across all apps) had a single entry. If the user had visited multiple apps, the total history length was always > 1, so Back kept popping across app boundaries.

## Affected Systems

- `packages/studio-core/src/lib/navigation/validation.ts` — `isRootRouteOnly()` guard function
- `packages/studio-core/src/lib/navigation/BackDispatcher.ts` — Back key event handler

## Root Cause

The `isRootRouteOnly()` function used the **total global history length** to determine if Back should be blocked:

```typescript
// BEFORE (broken)
export function isRootRouteOnly(history: NavigationHistory): boolean {
  return history.length <= 1;
}
```

This treated the entire navigation history as one flat stack. It had no concept of per-app isolation. As soon as the user visited more than one app, `history.length > 1` was always true, and Back was never blocked at any app's root screen.

## Investigation Notes

- Confirmed by logging `history` array contents: entries from multiple apps were interleaved.
- The `BackDispatcher` correctly called `isRootRouteOnly()` but received a misleading `false` because the function's logic was fundamentally wrong for a multi-app architecture.

## Failed Attempts

None — the root cause was identified immediately from the function signature.

## Successful Solution

Rewrote `isRootRouteOnly()` to count **consecutive entries for the current app** from the top of the history stack, instead of using the total length:

```typescript
// AFTER (fixed)
export function isRootRouteOnly(history: NavigationHistory): boolean {
  if (history.length === 0) return true;
  const currentApp = history[history.length - 1].app;
  let count = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].app === currentApp) {
      count++;
    } else {
      break;
    }
  }
  return count <= 1;
}
```

This walks backward from the top of the stack, counting only entries that belong to the currently active app. Once it encounters an entry from a different app, it stops. If only one entry (the root) exists for the current app, Back is blocked.

## Files Modified

- [validation.ts](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/studio-core/src/lib/navigation/validation.ts) — Rewrote `isRootRouteOnly()` (lines 155–168)

## Architecture Changes

- The navigation history remains a single global array (no structural change), but the **interpretation** of that array is now app-scoped at the guard level.
- This is a minimal, targeted fix that preserves the existing push/pop mechanics.

## Regression Risks

- If an app pushes history entries with an incorrect `app` field, the isolation breaks silently. Mitigated by the fact that `app` is set by the navigation store's `push()` action, not by individual components.
- Deep-linking or external navigation that bypasses the store could create orphaned entries.

## Lessons Learned

- **Multi-app navigation requires per-app stack isolation at the guard level, not just at the push level.** A shared history array is fine, but all guard functions must scope their checks to the current app.
- **Simple global checks (`length <= 1`) break as soon as the system grows beyond a single app.** Always design guards with the multi-context case in mind.

## How to Prevent This Bug in the Future

- Any new navigation guard function must be tested with a multi-app history stack, not just a single-app scenario.
- Consider adding a `getAppHistoryDepth(app: string)` utility function to `validation.ts` for reuse.
- Add unit tests for `isRootRouteOnly()` with multi-app history fixtures.
