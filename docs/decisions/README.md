# Livex Architectural Decisions

This directory records significant architectural decisions made during the development of Livex. Each decision document explains the context, options considered, decision made, and consequences.

---

## Contents

| Document | Date | Decision |
|---|---|---|
| [001-shared-bottom-navigation.md](001-shared-bottom-navigation.md) | 2026-07-12 | Centralize bottom navigation into a single global controller |
| [002-notification-service.md](002-notification-service.md) | 2026-07-19 | Create a centralized notification service instead of per-feature alerts |
| [003-per-app-back-isolation.md](003-per-app-back-isolation.md) | 2026-07-19 | Isolate back navigation stacks per application |

## How to Add a Decision

1. Create a new file with the next sequential number: `NNN-descriptive-name.md`
2. Use the standard ADR format: Context, Options, Decision, Consequences
3. Add an entry to the table above
4. Commit alongside the implementation

## Rules

- Decisions are permanent records — never delete or overwrite them. If a decision is superseded, add a new decision that references the old one.
- Every significant architectural choice should be recorded here.
- This directory is the historical record of *why* the architecture is the way it is.
