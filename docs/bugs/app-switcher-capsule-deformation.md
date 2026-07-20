# App Switcher Capsule Deformation (Lemon Shape)

## Problem Summary

The active highlight capsule in the App Switcher bottom navigation bar deformed into a vertical "lemon" shape when 6 navigation items were displayed, making the UI look broken.

## Severity

Medium

## Status

Resolved (v4.2.1)

## Symptoms

- The glowing active indicator capsule behind the selected nav item became vertically elongated and horizontally compressed.
- The shape resembled a lemon or vertical ellipse rather than a smooth rounded rectangle or circle.
- Only occurred when 6 items were present in the bottom navigation bar (5 app items + switcher button).

## How to Reproduce

1. Open any sub-application that registers 6 bottom navigation items.
2. Observe the active highlight capsule shape.
3. Compare to the expected rounded-rectangle or circle shape.

## Expected Behavior

The active highlight capsule maintains a minimum width equal to its height (38px), forming a perfect circle when the item width is small, and a rounded rectangle when the item width is larger.

## Observed Behavior

The Bezier path generator (`pillPathD`) computed the capsule width from the difference between left and right item edges. When 6 items compressed the available space, the computed width fell below the capsule height, creating a vertically dominant ellipse.

## Affected Systems

- `packages/ui-shared/src/navigation/SharedNavigationBar.tsx` — Capsule path generator

## Root Cause

The `pillPathD` SVG path generator computed the capsule width as `rightX - leftX` without enforcing a minimum width. When the horizontal space per item was less than the capsule height `H = 38px`, the width became narrower than the height, producing a vertically stretched shape.

## Investigation Notes

- The deformation only appeared with 6 items because 5 items gave each item enough horizontal space to exceed 38px naturally.

## Failed Attempts

None — direct fix applied after root cause identification.

## Successful Solution

Added a minimum-width clamp to the `pillPathD` path generator: if `rightX - leftX < H`, pad both edges equally to enforce `width >= H`. This locks the capsule as a perfect circle at minimum and scales gracefully as a rounded rectangle when wider.

## Files Modified

- [SharedNavigationBar.tsx](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/ui-shared/src/navigation/SharedNavigationBar.tsx) — Clamped minimum capsule width in `pillPathD`

## Architecture Changes

None — localized fix within the SVG path generator.

## Regression Risks

- If the capsule height `H` changes, the minimum-width clamp must be updated to match.

## Lessons Learned

- **SVG path generators must enforce geometric constraints.** Never assume input dimensions will always be within valid ranges.
- **Test UI components at boundary conditions** (minimum items, maximum items, extreme screen widths).

## How to Prevent This Bug in the Future

- Add visual snapshot tests for the bottom navigation bar at item counts of 3, 4, 5, and 6.
- Document the capsule geometry constraints in the component's JSDoc comments.
