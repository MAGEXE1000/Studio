# Livex Architectural Invariant

Before implementing any feature, identify whether it belongs to one of the project's shared systems.

---

## The Rule

> **One implementation. Multiple consumers. Never the opposite.**

Any implementation that duplicates an existing shared behavior is an **architectural defect** and must be refactored into the shared system instead.

The default assumption is always: implement once in the shared layer, consume from every application.

## Shared Systems Registry

The following systems are shared across all Livex sub-applications. If a requested change affects any of these systems, the implementation **must** occur inside the shared architecture. It must **never** be implemented only for one application unless the requirement explicitly states that the behavior should differ.

| System                   | Location                                                                   | Architecture Doc                                                                                                                         |
| ------------------------ | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Bottom Navigation**    | `packages/studio-core/src/lib/navigation/useBottomNavigationStore.ts`      | [bottom-navigation.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/architecture/bottom-navigation.md)       |
| **App Switcher**         | `packages/ui-shared/src/navigation/SharedNavigationBar.tsx`                | [app-switcher.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/architecture/app-switcher.md)                 |
| **Transition Engine**    | `packages/studio-core/src/lib/navigation/useApplicationTransitionStore.ts` | [transition-engine.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/architecture/transition-engine.md)       |
| **Navigation System**    | `packages/studio-core/src/lib/navigation/`                                 | [navigation.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/architecture/navigation.md)                     |
| **Motion System**        | `packages/ui-shared/` (motion tokens, springs, easings)                    | [motion-system.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/architecture/motion-system.md)               |
| **Theme Engine**         | `packages/studio-core/src/lib/themeTransitionEngine.ts`                    | [theme-engine.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/architecture/theme-engine.md)                 |
| **Design System**        | `packages/ui-shared/src/components/design-system/`                         | [design-system.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/architecture/design-system.md)               |
| **Notification Service** | `packages/studio-core/src/lib/notifications/NotificationService.ts`        | [notification-service.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/architecture/notification-service.md) |
| **Cloud Sync Engine**    | `packages/studio-core/src/lib/sync/sync.ts`                                | [sync-engine.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/architecture/sync-engine.md)                   |
| **Shared UI Components** | `packages/ui-shared/src/components/`                                       | [shared-ui.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/architecture/shared-ui.md)                       |
| **OTA Updater**          | `packages/studio-core/src/lib/updater/`                                    | [updater.md](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/docs/architecture/updater.md)                           |
| **Auth & Security**      | `packages/studio-core/src/lib/services/auth.ts`, `security.ts`             | —                                                                                                                                        |
| **Search Index**         | `packages/ui-shared/` (centralized search registration)                    | —                                                                                                                                        |

## Decision Framework

When starting any task, ask these questions in order:

1. **Does this feature already exist?** → Search the codebase first. If it exists, extend or reuse it.
2. **Does this belong to a shared system?** → Check the registry above. If yes, implement in the shared layer.
3. **Will multiple apps need this?** → If yes, implement as shared. If genuinely app-specific, implement locally.
4. **Am I duplicating something?** → If you're writing code that feels familiar, stop and search for the existing implementation.

## Violations

The following are architectural violations:

- Implementing a feature in one app that should be shared across all apps.
- Creating a new store for data that already exists in a shared store.
- Adding a new animation controller when the motion system already provides the required tokens.
- Creating per-app theme handling instead of using the centralized Theme Engine.
- Duplicating navigation logic instead of using the shared Navigation System.
- Adding local notification handling instead of publishing to the Notification Service.

When a violation is discovered, it must be refactored into the shared system before the task is considered complete.
