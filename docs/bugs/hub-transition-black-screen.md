# Hub Transition Black Screen

## Problem Summary

Switching applications via the App Switcher or returning to the Hub would freeze the screen on a solid black background, requiring a full app restart to recover.

## Severity

Critical

## Status

Resolved (v4.2.1)

## Symptoms

- Screen turns completely black after tapping the Hub icon or switching between applications.
- No UI elements render; the app appears frozen.
- Touch input is unresponsive — only a full kill-and-restart recovers the app.
- Occurs intermittently, most often on rapid double-taps or when switching back from Stagex/Groovex to the Hub.

## How to Reproduce

1. Open any sub-application (e.g., Groovex).
2. Tap the App Switcher button in the bottom navigation bar.
3. Rapidly tap the Hub icon to return home.
4. Alternatively, double-tap the Hub icon quickly.
5. Observe a permanent black screen with no rendered content.

## Expected Behavior

The transition animation (logo formation → zoom → reveal) completes within ~1 second, and the Hub home screen renders normally.

## Observed Behavior

The transition state machine enters `LOGO_FORMATION` or `PREPARING` but never advances to `ZOOMING` or `IDLE`. The app freezes in a blank/black intermediate state indefinitely.

## Affected Systems

- `packages/studio-core/src/lib/navigation/useApplicationTransitionStore.ts` — Transition state machine
- `packages/ui-shared/src/components/launch/ApplicationTransitionEngine.tsx` — Transition animation renderer
- Bottom Navigation bar and App Switcher overlay

## Root Cause

The transition state machine had a **deadlock condition** between two prerequisites:

1. `appPreloaded` — set when the target app's assets finish loading.
2. `logoFormed` — set when the logo entry animation completes.

The state machine required both flags to be `true` while in the `LOGO_FORMATION` state to advance to `ZOOMING`. However, if `appPreloaded` resolved _before_ the machine entered `LOGO_FORMATION` (which happened during rapid taps), the flag was set and consumed during `PREPARING`, and the machine would wait forever for a second `appPreloaded` signal that never came.

Additionally, calling `requestTransition()` while a previous transition was still in-flight did not reset the state machine, causing the new transition to be silently dropped.

## Investigation Notes

- Initial hypothesis: Framer Motion `onAnimationComplete` callback not firing → disproven by adding console logging.
- Second hypothesis: Race condition between `appPreloaded` and `logoFormed` → confirmed by logging timestamps of both events.
- Key insight: The `setAppPreloaded` action checked `state === 'LOGO_FORMATION'` before advancing, but preloading could complete during `PREPARING`.

## Failed Attempts

1. **Adding longer timeouts to the PREPARING state**: Delayed the symptom but did not fix the root cause. The deadlock still occurred, just less frequently.
2. **Force-resetting state on every render cycle**: Caused visual glitches where transitions would restart mid-animation.

## Successful Solution

1. **Force Escape Hatch**: Modified `requestTransition()` to detect if the state is not `IDLE` and force-call `reset()` synchronously before initiating the new transition. This prevents overlapping transitions.
2. **Dual-State Advancement Guard**: Updated both `setAppPreloaded` and `setLogoFormed` to check if _both_ conditions are satisfied regardless of the current state (`PREPARING` or `LOGO_FORMATION`), advancing immediately when ready.
3. **Watchdog Safety Timer**: Added a 1.5-second `setTimeout` fallback inside `ApplicationTransitionEngine.tsx` that force-calls `completeTransition()` if the animation callbacks fail to trigger.

## Files Modified

- [useApplicationTransitionStore.ts](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/studio-core/src/lib/navigation/useApplicationTransitionStore.ts) — State machine reset logic and dual-state guard
- [ApplicationTransitionEngine.tsx](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/ui-shared/src/shared/animation/ApplicationTransitionEngine.tsx) — Watchdog safety timer

## Architecture Changes

- Transition state machine now supports **interruption**: a new transition request always resets the previous in-flight transition.
- Watchdog timer pattern established as a safety net for animation-driven state machines.

## Regression Risks

- The watchdog timer could prematurely complete a transition if the animation is legitimately slow on very old devices. Mitigated by choosing a generous 1.5s threshold.
- Force-resetting mid-transition could cause a brief visual flash. Acceptable trade-off vs. a permanent black screen.

## Lessons Learned

- **Never gate state transitions on multiple async prerequisites without handling all ordering permutations.** If A and B are both required, the machine must advance regardless of which completes first.
- **Animation-driven state machines need watchdog timers.** Framer Motion's `onAnimationComplete` is not guaranteed to fire (e.g., if the component unmounts mid-animation).
- **State machines must handle re-entry.** If a transition is requested while one is in-flight, the behavior must be explicitly defined (interrupt, queue, or reject).

## How to Prevent This Bug in the Future

- Add integration tests that simulate rapid sequential transition requests.
- Ensure all state machine transitions have explicit timeout fallbacks.
- Document state machine diagrams for any new animation-driven flows.
- Review all `onAnimationComplete` callbacks for unmount safety.
