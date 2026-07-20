# ADR 002: Centralized Notification Service

**Date**: 2026-07-19  
**Status**: Accepted  
**Supersedes**: N/A

## Context

System events (OTA updates, auth changes, sync results) were displayed using ad-hoc alert dialogs and console messages. There was no unified notification system, no persistence, and no way for the user to review past events.

## Options Considered

1. **Per-feature toast/alert dialogs** — Each subsystem shows its own alerts. Simple but fragmented, no history.
2. **Third-party notification library** — Use a library like `react-toastify`. Rejected due to styling constraints and lack of persistence.
3. **Centralized Zustand notification store** — A single `useNotificationService` store with categories, priorities, actions, and encrypted persistence.

## Decision

Option 3: Centralized Zustand store with encrypted persistence and a timeline UI in the Hub.

## Consequences

- **Positive**: All system events flow through one store. Users can review notification history. Persistence survives app restarts. Category-based icons and filtering.
- **Negative**: No deduplication — the same event published twice creates two entries. No maximum notification count (unbounded growth).
- **Trade-off**: The store runs selectors in two components (`StudioHub` and `HubSettings`), but Zustand's memoization makes this negligible.
