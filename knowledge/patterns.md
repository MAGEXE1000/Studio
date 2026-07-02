# Reusable Knowledge — Coding Design Patterns

This document describes the sync state-machine patterns, auth epoch locks, and UI wiring rules.

---

## 1. Auth State Mutation Locks
To prevent cross-user data leakage during auth swaps:
- **Epoch Counters**: The sync engine registers an atomic `epoch` counter incremented on every auth state change. If an in-flight write resolves but the `epoch` has shifted, the data write promise is dropped.
- **Sync Locking**: Core engine wraps sync events in `enqueueRun()`, locking an in-flight execution promise to prevent concurrent sync execution races.

Source:
* [AGENTS.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/AGENTS.md#L85-L90)

---

## 2. UI Action Wiring
- **Full Trace Requirement**: All functional controls must map explicitly:
  `UI Component -> Event Handler -> State Action -> Store Update -> UI Re-render`.
  Trace the full cycle before declaring a widget complete.

Source:
* [AGENTS.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/AGENTS.md#L150-L152)
