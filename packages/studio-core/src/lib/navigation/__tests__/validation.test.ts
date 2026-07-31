import { describe, it, expect, vi } from 'vitest';

// Mock the navigation store to avoid Zustand persist middleware issues in Node.js.
// printDiagnosticsDump (called on validation errors) reads from this store.
vi.mock('../../store/useNavigationStore.js', () => ({
  useNavigationStore: {
    getState: () => ({
      history: [],
      transitionType: null,
      isTransitioning: false,
      gestureState: 'idle',
      predictiveProgress: 0,
      activeHandlers: [],
    }),
    subscribe: () => () => {},
  },
}));

import {
  normalizeAndValidateRoute,
  isRouteEqual,
  detectRecursion,
  isRootRouteOnly,
} from '../validation';
import type { NavigationRoute, NavigationHistory } from '../navigationTypes';

// ─── normalizeAndValidateRoute ──────────────────────────────────────────────

describe('normalizeAndValidateRoute', () => {
  it('normalizes a minimal route with only app', () => {
    const result = normalizeAndValidateRoute({ app: 'hub' });
    expect(result).toEqual({ app: 'hub' });
  });

  it('preserves valid tab values', () => {
    const result = normalizeAndValidateRoute({ app: 'chords', tab: 'settings' });
    expect(result).toEqual({ app: 'chords', tab: 'settings' });
  });

  it('strips invalid tab values silently', () => {
    const result = normalizeAndValidateRoute({ app: 'chords', tab: 'invalid' as any });
    expect(result).toEqual({ app: 'chords' });
    expect(result.tab).toBeUndefined();
  });

  it('preserves valid type values', () => {
    const result = normalizeAndValidateRoute({ app: 'hub', type: 'modal' });
    expect(result).toEqual({ app: 'hub', type: 'modal' });
  });

  it('strips invalid type values silently', () => {
    const result = normalizeAndValidateRoute({ app: 'hub', type: 'drawer' as any });
    expect(result).toEqual({ app: 'hub' });
    expect(result.type).toBeUndefined();
  });

  it('preserves page, subView, and id string fields', () => {
    const result = normalizeAndValidateRoute({
      app: 'drums',
      page: 'library',
      subView: 'patterns',
      id: 'preset-42',
    });
    expect(result).toEqual({
      app: 'drums',
      page: 'library',
      subView: 'patterns',
      id: 'preset-42',
    });
  });

  it('ignores non-string page/subView/id values', () => {
    const result = normalizeAndValidateRoute({
      app: 'hub',
      page: 123 as any,
      subView: true as any,
      id: undefined,
    });
    expect(result).toEqual({ app: 'hub' });
  });

  it('throws when app is missing', () => {
    expect(() => normalizeAndValidateRoute({})).toThrow(
      'Route missing required "app" property'
    );
  });

  it('throws when app is invalid', () => {
    expect(() => normalizeAndValidateRoute({ app: 'invalid' as any })).toThrow(
      'Invalid "app" value: "invalid"'
    );
  });

  it('accepts all valid app values', () => {
    const validApps: NavigationRoute['app'][] = ['hub', 'chords', 'drums', 'stage', 'groovex', 'vocalex'];
    for (const app of validApps) {
      const result = normalizeAndValidateRoute({ app });
      expect(result.app).toBe(app);
    }
  });

  it('accepts all valid tab values', () => {
    const validTabs: NonNullable<NavigationRoute['tab']>[] = ['home', 'settings', 'profile', 'help'];
    for (const tab of validTabs) {
      const result = normalizeAndValidateRoute({ app: 'hub', tab });
      expect(result.tab).toBe(tab);
    }
  });

  it('accepts all valid type values', () => {
    const validTypes: NonNullable<NavigationRoute['type']>[] = ['screen', 'modal', 'sheet', 'overlay'];
    for (const type of validTypes) {
      const result = normalizeAndValidateRoute({ app: 'hub', type });
      expect(result.type).toBe(type);
    }
  });

  it('strips extra properties not in NavigationRoute', () => {
    const result = normalizeAndValidateRoute({
      app: 'hub',
      foo: 'bar',
      nested: { x: 1 },
    } as any);
    expect(result).toEqual({ app: 'hub' });
    expect((result as any).foo).toBeUndefined();
    expect((result as any).nested).toBeUndefined();
  });
});

// ─── isRouteEqual ────────────────────────────────────────────────────────────

describe('isRouteEqual', () => {
  it('returns true for identical routes', () => {
    const a: NavigationRoute = { app: 'hub', tab: 'home' };
    const b: NavigationRoute = { app: 'hub', tab: 'home' };
    expect(isRouteEqual(a, b)).toBe(true);
  });

  it('returns false when app differs', () => {
    const a: NavigationRoute = { app: 'hub' };
    const b: NavigationRoute = { app: 'drums' };
    expect(isRouteEqual(a, b)).toBe(false);
  });

  it('returns false when tab differs', () => {
    const a: NavigationRoute = { app: 'hub', tab: 'home' };
    const b: NavigationRoute = { app: 'hub', tab: 'settings' };
    expect(isRouteEqual(a, b)).toBe(false);
  });

  it('returns false when type differs', () => {
    const a: NavigationRoute = { app: 'hub', type: 'modal' };
    const b: NavigationRoute = { app: 'hub', type: 'sheet' };
    expect(isRouteEqual(a, b)).toBe(false);
  });

  it('considers undefined fields equal (both undefined)', () => {
    const a: NavigationRoute = { app: 'hub' };
    const b: NavigationRoute = { app: 'hub' };
    expect(isRouteEqual(a, b)).toBe(true);
  });

  it('returns false when one has a field and the other does not', () => {
    const a: NavigationRoute = { app: 'hub', page: 'library' };
    const b: NavigationRoute = { app: 'hub' };
    expect(isRouteEqual(a, b)).toBe(false);
  });

  it('checks all 6 fields for equality', () => {
    const full: NavigationRoute = {
      app: 'chords',
      tab: 'home',
      page: 'library',
      subView: 'grid',
      id: 'abc-123',
      type: 'screen',
    };
    expect(isRouteEqual(full, { ...full })).toBe(true);
    expect(isRouteEqual(full, { ...full, id: 'different' })).toBe(false);
    expect(isRouteEqual(full, { ...full, subView: 'list' })).toBe(false);
  });
});

// ─── detectRecursion ─────────────────────────────────────────────────────────

describe('detectRecursion', () => {
  it('returns false for history with fewer than 2 entries', () => {
    expect(detectRecursion([], { app: 'hub' })).toBe(false);
    expect(detectRecursion([{ app: 'hub' }], { app: 'chords' })).toBe(false);
  });

  it('detects A -> A -> A pattern (same route repeated)', () => {
    const history: NavigationHistory = [
      { app: 'hub' },
      { app: 'hub' },
    ];
    expect(detectRecursion(history, { app: 'hub' })).toBe(true);
  });

  it('does not flag A -> B -> C as recursion', () => {
    const history: NavigationHistory = [
      { app: 'hub' },
      { app: 'chords' },
    ];
    expect(detectRecursion(history, { app: 'drums' })).toBe(false);
  });

  it('does not flag A -> B -> A when last two are not equal', () => {
    const history: NavigationHistory = [
      { app: 'hub' },
      { app: 'chords' },
    ];
    // This is A -> B, next is A. secondLast=A, last=B, next=A.
    // detectRecursion checks isRouteEqual(secondLast, next) && isRouteEqual(last, secondLast)
    // That's isRouteEqual(hub, hub) && isRouteEqual(chords, hub) = true && false = false
    expect(detectRecursion(history, { app: 'hub' })).toBe(false);
  });
});

// ─── isRootRouteOnly ─────────────────────────────────────────────────────────

describe('isRootRouteOnly', () => {
  it('returns true for empty history', () => {
    expect(isRootRouteOnly([])).toBe(true);
  });

  it('returns true for a single-entry history', () => {
    expect(isRootRouteOnly([{ app: 'hub' }])).toBe(true);
  });

  it('returns false when the same app has multiple entries', () => {
    const history: NavigationHistory = [
      { app: 'hub' },
      { app: 'hub', tab: 'settings' },
    ];
    expect(isRootRouteOnly(history)).toBe(false);
  });

  it('returns true when the current app has exactly 1 entry (preceded by a different app)', () => {
    const history: NavigationHistory = [
      { app: 'hub' },
      { app: 'chords' },
    ];
    expect(isRootRouteOnly(history)).toBe(true);
  });

  it('handles longer stacks correctly', () => {
    const history: NavigationHistory = [
      { app: 'hub' },
      { app: 'chords' },
      { app: 'chords', tab: 'settings' },
      { app: 'chords', page: 'library' },
    ];
    // The current app is 'chords' with 3 consecutive entries from the tail
    expect(isRootRouteOnly(history)).toBe(false);
  });

  it('counts only the contiguous tail segment for the current app', () => {
    const history: NavigationHistory = [
      { app: 'chords' },          // not counted — interrupted by hub
      { app: 'hub' },
      { app: 'drums' },
    ];
    // Current app is 'drums', only 1 contiguous entry
    expect(isRootRouteOnly(history)).toBe(true);
  });
});
