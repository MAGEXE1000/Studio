import { type NavigationRoute, type NavigationHistory } from './navigationTypes';
import { useNavigationStore } from '../../store/useNavigationStore';

/**
 * Normalizes an incoming route partial and returns a strict NavigationRoute object.
 * Strips any extra un-mapped parameters to prevent history corruption.
 */
export function normalizeAndValidateRoute(route: Partial<NavigationRoute>): NavigationRoute {
  if (!route.app) {
    throw new Error('[Navigation Validation] Route missing required "app" property.');
  }

  const validApps = ['hub', 'chords', 'drums', 'stage', 'groovex', 'vocalex'];
  if (!validApps.includes(route.app)) {
    throw new Error(`[Navigation Validation] Invalid "app" value: "${route.app}".`);
  }

  const normalized: NavigationRoute = {
    app: route.app,
  };

  if (route.tab) {
    const validTabs = ['home', 'settings', 'profile', 'help'];
    if (validTabs.includes(route.tab)) {
      normalized.tab = route.tab;
    }
  }

  if (typeof route.page === 'string') {
    normalized.page = route.page;
  }
  if (typeof route.subView === 'string') {
    normalized.subView = route.subView;
  }
  if (typeof route.id === 'string') {
    normalized.id = route.id;
  }

  if (route.type) {
    const validTypes = ['screen', 'modal', 'sheet', 'overlay'];
    if (validTypes.includes(route.type)) {
      normalized.type = route.type;
    }
  }

  return normalized;
}

/**
 * Compares two routes for structural equality.
 */
export function isRouteEqual(a: NavigationRoute, b: NavigationRoute): boolean {
  return (
    a.app === b.app &&
    a.tab === b.tab &&
    a.page === b.page &&
    a.subView === b.subView &&
    a.id === b.id &&
    a.type === b.type
  );
}

/**
 * Detects recursive navigation patterns (e.g. alternating cycles in the tail of history).
 */
export function detectRecursion(history: NavigationHistory, next: NavigationRoute): boolean {
  if (history.length < 2) return false;

  // Simple cycle detection: A -> B -> A -> B
  const last = history[history.length - 1];
  const secondLast = history[history.length - 2];

  if (isRouteEqual(secondLast, next) && isRouteEqual(last, secondLast)) {
    return true;
  }

  return false;
}

/**
 * Returns true if a transition lock is active.
 */
export function isTransitionLocked(): boolean {
  if (typeof window === 'undefined' || (typeof process !== 'undefined' && process.versions && process.versions.node)) {
    return useNavigationStore.getState().isTransitioning;
  }
  return false;
}

/**
 * Prevents popping when only the root route exists.
 */
export function isRootRouteOnly(history: NavigationHistory): boolean {
  return history.length <= 1;
}
