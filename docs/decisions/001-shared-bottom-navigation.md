# ADR 001: Centralize Bottom Navigation

**Date**: 2026-07-12  
**Status**: Accepted  
**Supersedes**: N/A

## Context

Each sub-application (Chordex, Drumex, Groovex, Stagex, Vocalex) originally rendered its own bottom navigation bar. This led to duplicated code, inconsistent behavior, overlapping UI during transitions, and difficulty maintaining a unified motion system.

## Options Considered

1. **Per-app bottom navigation** — Each app manages its own bar. Simple but duplicated.
2. **Centralized bottom navigation controller** — A single global `BottomNavigationController` mounted at the app root, with apps registering their items dynamically.
3. **Tab router library** — Use a third-party tab router. Rejected due to coupling concerns and custom animation requirements.

## Decision

Option 2: Centralized controller with a global Zustand store (`useBottomNavigationStore`).

## Consequences

- **Positive**: Single source of truth for nav bar state, consistent motion system, cross-store cleanup during transitions, elimination of UI overlap bugs.
- **Negative**: Apps must register items via `useEffect` on mount (slight indirection). Adding cleanup logic requires manual wiring into `requestTransition()`.
- **Trade-off**: The global store is simple but has no automatic cleanup registry — new stores requiring transition cleanup must be manually added.
