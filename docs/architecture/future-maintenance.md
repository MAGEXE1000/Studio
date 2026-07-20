# Future Maintenance Guide

This document provides coding conventions, isolation rules, and recommendations for maintaining and extending the Studio codebase.

## Package Boundary Rules

### Strict Import Rules

These rules are enforced at build time and must never be violated:

```
✅ studio-android → studio-core, ui-shared, ui-android
✅ studio-web     → studio-core, ui-shared, ui-web
✅ ui-android     → studio-core, ui-shared
✅ ui-web         → studio-core, ui-shared
✅ ui-shared      → studio-core
✅ studio-core    → api-client-react, db (no UI packages)

❌ studio-android → ui-web
❌ studio-web     → ui-android
❌ studio-core    → ui-shared, ui-android, ui-web
❌ ui-shared      → ui-android, ui-web
```

### When to Use Each Package

| Package       | Use When                                                                        |
| ------------- | ------------------------------------------------------------------------------- |
| `studio-core` | Adding business logic, state, services, or utilities that are platform-agnostic |
| `ui-shared`   | Adding React components or feature modules that work on both Android and Web    |
| `ui-android`  | Adding Android-specific UI (native bridge integration, Capacitor-only features) |
| `ui-web`      | Adding Web-specific UI (sidebar layout, landing page, desktop features)         |

## Adding a New Feature Module

Follow the established pattern in `packages/ui-shared/src/features/`:

```
features/<module-name>/
├── components/       # React components (one per file, focused)
├── pages/            # Top-level page components
├── services/         # Module-specific API/service logic
├── state/            # Zustand store (if needed, keep small)
├── types/            # TypeScript type definitions
└── utilities/        # Pure helper functions
```

### Checklist

1. Create the directory structure above
2. Add an `index.ts` barrel export in your feature root
3. Register the app in `NavigationRoute.app` type (if new app-level module)
4. Add default route resolution in `NavigationCoordinator.resolveDefaultRoute()`
5. Add section definitions in `appRegistry.ts` (`APP_SECTIONS`)
6. Register the app's default settings in `useChordStore` (defaultTab, etc.)
7. Add lazy import in the appropriate `App.tsx` (Android and/or Web)
8. Use `SharedNavigationContainer` for sub-view management
9. Use `NavigationDispatcher.push()` for navigation — never manipulate history directly
10. Export from `ui-shared/src/index.ts` if consumed externally

## Navigation Guidelines

### DO

- Use `NavigationDispatcher.push({ app, page, type })` for all navigation
- Use `useBackHandler(priority, callback)` hook for custom back handling
- Use `SharedNavigationContainer` for multi-panel sub-views
- Set `route.type` to `'modal'` or `'sheet'` for overlays (triggers appropriate transitions)
- Read navigation state from `useNavigationStore` via `useShallow`

### DON'T

- Directly mutate `useNavigationStore` state
- Use browser `window.history` APIs
- Import React Router or any routing library
- Create new navigation patterns that bypass `NavigationDispatcher`
- Register multiple back handlers at the same priority from the same component

## State Management Guidelines

### Creating a New Store

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureReadLocal, secureWriteLocal } from '../lib/security';

export const useMyStore = create(
  persist(
    (set, get) => ({
      // State
      myField: 'default',
      // Actions
      setMyField: (value: string) => set({ myField: value }),
    }),
    {
      name: 'my-store-key-v1',
      version: 1,
      storage: createJSONStorage(() => ({
        getItem: secureReadLocal,
        setItem: secureWriteLocal,
        removeItem: localStorage.removeItem.bind(localStorage),
      })),
      partialize: (state) => ({
        myField: state.myField,
        // Exclude: functions, volatile UI state
      }),
      migrate: (persistedState, version) => {
        // Handle version migrations
        return persistedState;
      },
    }
  )
);
```

### Best Practices

- Use `partialize` to exclude functions and volatile state from persistence
- Use `useShallow` for selective subscriptions to prevent unnecessary re-renders
- Keep stores focused — split large stores into smaller, domain-specific ones
- Document migration steps when changing the persisted schema
- Increment persist `version` on every schema change
- Avoid high-frequency state updates in encrypted stores

## Component Size Guidelines

Keep components under these thresholds:

| Metric    | Target  | Maximum |
| --------- | ------- | ------- |
| Lines     | < 400   | 600     |
| File size | < 20 KB | 40 KB   |
| Props     | < 10    | 15      |

When a component exceeds these limits, extract sub-components, custom hooks, or utility functions.

## Animation Guidelines

### Using Framer Motion

```typescript
import { motion, AnimatePresence } from 'motion/react';
import { usePrefersReducedMotion, useAnimationSpeed } from '@workspace/ui-shared';

function MyComponent() {
  const reducedMotion = usePrefersReducedMotion();
  const speed = useAnimationSpeed();

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 * speed }}
    />
  );
}
```

### Rules

- Always check `usePrefersReducedMotion()` — skip animations if true
- Use `useAnimationSpeed()` to scale durations
- Use `AnimationCoordinator.startTransition()` for page-level transitions
- Prefer CSS transitions for simple opacity/transform changes
- Use Framer Motion for complex, gesture-driven, or spring animations

## Android Native Changes

### Adding a Capacitor Plugin Method

1. Add `@PluginMethod` annotated method in `AppInstallerPlugin.java`
2. Update the TypeScript interface in `apkDownloader.ts` or create a new plugin
3. Register the plugin in `MainActivity.java` if new
4. Handle the result in the calling JS module
5. Add diagnostics logging (call counter, instrumentation)
6. Update `getExtendedDiagnostics()` if the method has observable state

### Manifest Changes

When adding new permissions:

1. Add to `AndroidManifest.xml`
2. Handle runtime permission requests for dangerous permissions
3. Document in [android.md](android.md)
4. Update `AppInstallerPlugin.java` permission aliases if applicable

## OTA Update Changes

When modifying the update pipeline:

1. **Never skip states** — always use `transitionToState()` for FSM transitions
2. **Always log** — use `flightRecorder` for significant events
3. **Check installation lock** — call `isInstallationLocked()` before starting new operations
4. **Test recovery paths** — use `updaterSimulation.ts` for dev testing
5. **Update diagnostics** — add relevant fields to `diagnostics.ts`
6. **Preserve backward compat** — `version.json` and `app-release.json` schemas must remain backward compatible

## Documentation Maintenance

When making significant architectural changes:

1. Update the relevant doc in `docs/architecture/`
2. Run `node docs/architecture/scripts/refresh-docs.mjs` to validate
3. If adding a new module, create a dedicated `<module>.md` file
4. Update `dependency-graph.md` if package relationships change
5. Update `technical-debt.md` if adding/resolving debt
6. Include doc updates in the same PR as the code change

## Testing Recommendations

### Priority Test Areas

| Area                      | Type        | Rationale                                       |
| ------------------------- | ----------- | ----------------------------------------------- |
| Navigation validation     | Unit        | Route normalization, cycle detection, whitelist |
| Store migrations          | Unit        | 13-step migration chains must not break         |
| Auth flow                 | Integration | Dual Google Sign-In paths (native vs web)       |
| OTA state machine         | Unit        | 18-state FSM transition validity                |
| Semver parsing            | Unit        | Version comparison for update eligibility       |
| SharedNavigationContainer | Component   | Panel switching, keep-alive, transitions        |

### Test File Location

Place tests adjacent to source or in `__tests__/` subdirectories:

```
lib/navigation/__tests__/validation.test.ts
lib/updater/__tests__/stateMachine.test.ts
```
