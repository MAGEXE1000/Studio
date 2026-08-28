# Version 4.5.46

Release Date: 2026-08-28

### Changed

- Event-Driven Architecture Modernization: Eliminated untyped synthetic `CustomEvent` and `window.dispatchEvent` patterns across navigation, tab switching, quick actions, settings navigation, and lifecycle events in favor of type-safe Zustand stores and typed subscription primitives.
- Unified Navigation & Deep Linking: Replaced `studio:navigate-to-app`, `studio:navigate-to-tab`, `studio:set-active-tab`, `studio:trigger-quick-action`, `studio:open-settings-section`, and `studio:open-auth` with direct calls to `NavigationDispatcher.push(...)` and `useBottomNavigationStore`.
- User Profile & Cover Subscriptions: Replaced custom avatar and cover photo events with canonical `getUserCover`, `setUserCover`, and `subscribeUserCover` primitives.
- Startup & Lifecycle Coordination: Extended `StartupCoordinator` with typed subscribers `subscribeStartupComplete` and `subscribeIntroDone`, replacing window event dispatches across entry points and launch animation engines.
- Developer Diagnostics Performance Optimization: Optimized `PerformanceProfiler.getGPULayerCount()` by replacing unthrottled full-DOM traversals with targeted composited selectors and a 3-second cache. Consolidated duplicate logging in `EmergencyDebugOverlay` to use canonical `getLogs()`. Batched diagnostics listeners with `requestAnimationFrame` micro-batching to eliminate UI thread render thrashing.
