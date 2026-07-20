# Bottom Navigation Overlap During App Switching

## Problem Summary

When switching between applications (e.g., Groovex → Stagex), the previous application's bottom navigation bar, App Switcher overlay, or animated elements remained visible and overlapped with the incoming application's UI.

## Severity

High

## Status

Resolved (v4.2.4)

## Symptoms

- Two bottom navigation bars visible simultaneously during transitions.
- The App Switcher popover from the previous app persists over the new app's content.
- Navigation items from the wrong app appear briefly before being replaced.
- Visual "z-fighting" where overlapping elements flicker.

## How to Reproduce

1. Open Groovex from the Hub.
2. Open the App Switcher overlay.
3. While the App Switcher is visible, tap on Stagex.
4. Observe the Groovex bottom nav bar and switcher overlay remaining visible over the Stagex interface.

## Expected Behavior

When a new app transition begins, all UI artifacts from the previous application (bottom navigation bar, App Switcher, overlays) are immediately hidden before the transition animation starts.

## Observed Behavior

The previous application's bottom navigation and App Switcher remained mounted and visible during and after the transition, creating a layered/duplicated UI.

## Affected Systems

- `packages/studio-core/src/lib/navigation/useApplicationTransitionStore.ts` — Transition orchestrator
- `packages/studio-core/src/lib/navigation/useBottomNavigationStore.ts` — Bottom navigation state
- `packages/ui-shared/src/navigation/BottomNavigationController.tsx` — Bottom navigation renderer

## Root Cause

The transition store's `requestTransition()` action initiated the transition animation but did **not** synchronously clear the bottom navigation state. The bottom navigation store (`useBottomNavigationStore`) maintained its own independent lifecycle, and no cleanup hook existed between the transition and navigation subsystems.

The App Switcher's `isOpen` state was also independent — closing it was the responsibility of the component that opened it, not the transition system.

## Investigation Notes

- Confirmed the issue was not CSS z-index related (both bars had correct stacking).
- The root issue was lifecycle coupling: the transition system and the navigation system were fully decoupled with no coordination point.

## Failed Attempts

1. **CSS `display: none` on transition start**: Only worked visually but left the navigation store in a dirty state, causing items to flash back on the next render.

## Successful Solution

Modified `requestTransition()` and the `reset()` action inside `useApplicationTransitionStore.ts` to **synchronously call `useBottomNavigationStore.getState().reset()`** at the moment a transition begins. This:

1. Sets `visible` to `false`
2. Closes the App Switcher (`isSwitcherOpen = false`)
3. Clears registered navigation items

The incoming application then re-registers its own items cleanly after mounting.

## Files Modified

- [useApplicationTransitionStore.ts](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/studio-core/src/lib/navigation/useApplicationTransitionStore.ts) — Added `useBottomNavigationStore.getState().reset()` calls in `requestTransition` and `reset` actions.

## Architecture Changes

- Established a **cross-store coordination pattern**: the transition store now owns the responsibility of cleaning up the navigation store at transition boundaries.
- This is a one-directional dependency (transition → navigation), not circular.

## Regression Risks

- If a new store is added that also needs cleanup during transitions, it must be manually wired into `requestTransition()`. No automatic discovery mechanism exists.
- The reset clears items, so any sub-app that registers items in `useEffect` must do so after mount, which is the standard pattern.

## Lessons Learned

- **Decoupled stores still need coordination at lifecycle boundaries.** Independence is good for day-to-day operation, but transitions are system-wide events that require explicit cross-store communication.
- **Synchronous cleanup before async animations prevents ghost UI.** Never rely on the animation completion to clean up the previous state — do it before the animation starts.

## How to Prevent This Bug in the Future

- When adding new global UI stores (e.g., modals, toasts, drawers), check whether they need cleanup during `requestTransition()`.
- Consider creating a `transitionCleanup` registry where stores can register their own cleanup callbacks, avoiding manual wiring.
- Add a visual regression test that screenshots the transition midpoint to detect overlapping elements.
