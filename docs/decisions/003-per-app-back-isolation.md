# ADR 003: Per-App Back Navigation Isolation

**Date**: 2026-07-19  
**Status**: Accepted  
**Supersedes**: N/A

## Context

The hardware/software Back button used a single global history stack. When the user visited multiple apps, pressing Back from an app's root screen would unexpectedly navigate into a previously visited application instead of stopping.

## Options Considered

1. **Separate history arrays per app** — Each app owns its own array. Clean isolation but requires migrating the entire navigation system and breaking the global history.
2. **Scoped guard function** — Keep the single global history array but modify `isRootRouteOnly()` to count only consecutive entries belonging to the current app.
3. **Clear history on app switch** — Wipe history when switching apps. Rejected because it breaks the ability to return to previous app states.

## Decision

Option 2: Scoped guard function. The navigation history remains a single global array, but `isRootRouteOnly()` walks backward from the top of the stack counting only entries for the current app.

## Consequences

- **Positive**: Minimal code change (single function rewrite). No migration of the history system. Back navigation correctly stops at each app's root screen.
- **Negative**: If an app pushes entries with an incorrect `app` field, isolation breaks silently. Deep-linking bypassing the store could create orphaned entries.
- **Trade-off**: The global history array remains shared, which means the guard function must always be app-scoped. Any future guard function must follow the same pattern.
