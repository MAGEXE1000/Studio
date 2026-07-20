# Theme Transition Main-Thread Jank

## Problem Summary

Switching between light and dark themes caused visible UI stuttering, dropped frames, and a sluggish transition animation, especially on mid-range Android devices.

## Severity

Medium

## Status

Resolved (v4.2.1)

## Symptoms

- Theme toggle animation stutters visibly (dropped frames, janky motion).
- The radial clip-path expansion appears choppy instead of smooth.
- Touch input becomes temporarily unresponsive during the transition (~300–500ms).
- Performance profiling shows main-thread paint operations exceeding 16ms frame budgets.

## How to Reproduce

1. Open Settings → Appearance.
2. Toggle the theme switch between Light and Dark mode.
3. Observe the transition animation quality.
4. On a mid-range Android device, the stutter is more pronounced.

## Expected Behavior

The theme transition should execute as a smooth, fluid radial expansion with no perceptible frame drops, completing in ~500ms.

## Observed Behavior

The transition relied on JavaScript-driven DOM manipulation to swap CSS custom properties, then animated a `clip-path` expansion. The property swap triggered a full layout recalculation on the main thread, blocking the animation frames.

## Affected Systems

- `packages/studio-core/src/lib/themeTransitionEngine.ts` — Theme transition orchestrator
- `packages/ui-shared/src/components/hub/StudioHub.tsx` — Theme toggle UI

## Root Cause

Two compounding issues:

1. **Synchronous CSS property swap**: Changing `--c-bg-primary`, `--c-text-primary`, and ~40 other CSS custom properties triggered a synchronous full-tree style recalculation before the animation could begin.
2. **JavaScript-driven animation**: The radial clip-path was animated via `requestAnimationFrame` with manual interpolation, competing with the style recalc for main-thread time.

## Investigation Notes

- Chrome DevTools Performance trace showed a 45ms style recalculation blocking the first animation frame.
- The `clip-path` animation itself was GPU-composited, but the CSS property swap preceding it was not.

## Failed Attempts

1. **`requestAnimationFrame` batching of CSS property writes**: Reduced jank slightly but did not eliminate the style recalc cost — all properties still changed in one frame.

## Successful Solution

Migrated the theme transition to use the **View Transitions API** (`document.startViewTransition()`):

1. The API captures a screenshot of the current state before any DOM changes.
2. CSS custom properties are swapped inside the callback (while the screenshot is displayed).
3. The API cross-fades between the old screenshot and the new live DOM using GPU-composited pseudo-elements.
4. Added a custom CSS `::view-transition-new(root)` animation with a circular `clip-path` expansion and a chromatic bloom filter (`brightness(1.2) contrast(1.2) saturate(1.5)`) at the leading edge.
5. Duration set to 500ms with `cubic-bezier(0.25, 1, 0.5, 1)` for immediate responsiveness.

This moved the entire transition to the compositor thread, eliminating main-thread blocking.

## Files Modified

- [themeTransitionEngine.ts](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/studio-core/src/lib/themeTransitionEngine.ts) — Rewrote transition to use View Transitions API with chromatic bloom keyframes.

## Architecture Changes

- Theme transitions now depend on the View Transitions API (`document.startViewTransition`). A graceful fallback to instant swap exists for browsers/WebViews that don't support the API.

## Regression Risks

- Older WebView versions (pre-Chromium 111) don't support View Transitions. The fallback is an instant theme swap with no animation — functional but not premium.
- The chromatic bloom filter adds GPU memory pressure during the 500ms transition. Not an issue on modern devices but could cause frame drops on very old hardware.

## Lessons Learned

- **Never animate CSS custom property changes on the main thread.** The style recalculation cost is proportional to the number of elements using those properties (which is the entire DOM).
- **The View Transitions API is the correct tool for full-page visual transitions.** It handles screenshot capture, cross-fade, and GPU compositing automatically.
- **Chromatic effects at animation edges (bloom, blur) create a premium perception** with minimal GPU cost when applied to a single pseudo-element rather than the entire DOM.

## How to Prevent This Bug in the Future

- Any future full-page visual transition (not just theme) should use the View Transitions API.
- Profile theme transitions on a low-end Android device before merging changes.
- Add a `performance_mode` check that disables the bloom filter on low-end devices.
