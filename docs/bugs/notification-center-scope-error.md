# Notification Center TypeScript Scope Error

## Problem Summary

The `unreadCount` variable used in the Hub settings navigation row was declared inside the main `StudioHub` component but referenced inside the `HubSettings` sub-component, causing a TypeScript compilation error (`TS2304: Cannot find name 'unreadCount'`).

## Severity

Low

## Status

Resolved (v4.2.4)

## Symptoms

- `pnpm typecheck:libs` fails with:
  ```
  packages/ui-shared/src/components/hub/StudioHub.tsx(6096,89): error TS2304: Cannot find name 'unreadCount'.
  ```
- The application cannot be built or deployed until the error is resolved.

## How to Reproduce

1. Run `pnpm typecheck:libs` from the repository root.
2. Observe the compilation error on line 6096 of `StudioHub.tsx`.

## Expected Behavior

All TypeScript files compile without errors.

## Observed Behavior

The `unreadCount` variable was declared via a Zustand selector hook inside the `StudioHub` default export function (line 189), but it was referenced inside the `HubSettings` function component (line 6096), which is a separate function scope. TypeScript correctly reported the variable as undefined in that scope.

## Affected Systems

- `packages/ui-shared/src/components/hub/StudioHub.tsx` — Hub settings view

## Root Cause

When the Notification Center feature was implemented, the `unreadCount` Zustand hook call was added to the main `StudioHub` component, and the settings row that displays the unread badge was placed inside the `HubSettings` sub-component. These are **separate function scopes** — variables from one are not accessible in the other.

This is a classic **variable scoping error** introduced during feature implementation when code is added to the wrong component boundary in a large file (7000+ lines).

## Investigation Notes

- The file has multiple component functions defined in sequence. The boundary between `StudioHub` (line 185) and `HubSettings` (line 3172) is easy to miss in a 7000+ line file.
- `git grep -n "unreadCount"` immediately identified both the declaration site and the usage sites.

## Failed Attempts

None — the root cause was immediately clear from the error message.

## Successful Solution

Added a duplicate `useNotificationService` selector hook call inside the `HubSettings` component to provide `unreadCount` in the correct scope:

```typescript
// Inside HubSettings (line ~3200)
const unreadCount = useNotificationService(
  (s) => s.notifications.filter((n) => !n.read && !n.dismissed).length
);
```

## Files Modified

- [StudioHub.tsx](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/ui-shared/src/features/hub/components/StudioHub.tsx) — Added `unreadCount` selector inside `HubSettings` (line 3200)

## Architecture Changes

None — localized scope fix.

## Regression Risks

- The `unreadCount` selector now runs in two components (`StudioHub` and `HubSettings`). Since Zustand selectors are lightweight and memoized, the performance impact is negligible.

## Lessons Learned

- **In large files with multiple component functions, always verify which component scope you're adding hooks to.** A variable declared in component A is not available in component B, even if they're in the same file.
- **Run `pnpm typecheck:libs` immediately after adding new hooks or variables.** Do not wait until the end of a feature implementation to compile-check.
- **Large monolithic files (7000+ lines) increase the risk of scoping errors.** Consider splitting `StudioHub.tsx` into smaller, focused modules.

## How to Prevent This Bug in the Future

- Run type-checking after every checkpoint, not just at the end.
- Consider extracting `HubSettings` into its own file to make component boundaries explicit.
- Use IDE "Go to Definition" to verify that a variable's declaration site is within the current function scope before referencing it.
