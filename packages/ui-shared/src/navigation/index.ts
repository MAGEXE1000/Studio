// navigation/index.ts — Shared navigation framework + re-export shims

// Shared framework (stays here)
export { SharedNavigationContainer } from './SharedNavigationContainer';

// Re-export shims for backward compatibility (moved to features/hub)
export { SharedNavigationBar } from '../features/hub/navigation/SharedNavigationBar';
export { BottomNavigationController } from '../features/hub/navigation/BottomNavigationController';

export * from '../shared/animation';
export * from '../features/hub/navigation/navStyles';
