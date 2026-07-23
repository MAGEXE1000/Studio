import { useState, useEffect, useRef } from 'react';
import { useNavigationStore } from './useNavigationStore';
import { useApplicationTransitionStore } from './useApplicationTransitionStore';

let _lastRouteChangeTime = 0;
let _lastInteractionTime = 0;

// â”€â”€â”€ navHidden â€” programmatic full-hide (preset editor, modals, etc.) â”€â”€â”€â”€â”€â”€â”€â”€
let _hidden = false;
let _locked = false;
const _listeners = new Set<(h: boolean) => void>();

const AUTO_SHOW_MS = 4000;
let _autoShowTimer: ReturnType<typeof setTimeout> | null = null;

function clearAutoShow() {
  if (_autoShowTimer) {
    clearTimeout(_autoShowTimer);
    _autoShowTimer = null;
  }
}
function emit(hidden: boolean) {
  _listeners.forEach((fn) => fn(hidden));
}

export function setNavLocked(locked: boolean) {
  if (_locked === locked) return;
  _locked = locked;
  if (!locked) {
    clearAutoShow();
    if (_hidden) {
      _hidden = false;
      emit(false);
    }
    // Also un-collapse when unlocking so the bar is always reachable.
    if (_collapsed) {
      _collapsed = false;
      emitCollapsed(false);
    }
  }
  onStateChanged();
}

export function setNavHidden(hidden: boolean) {
  if (_locked && !hidden) return;
  clearAutoShow();
  if (hidden && !_locked) {
    _autoShowTimer = setTimeout(() => {
      _autoShowTimer = null;
      if (_locked || !_hidden) return;
      _hidden = false;
      emit(false);
      onStateChanged();
    }, AUTO_SHOW_MS);
  }
  if (_hidden === hidden) return;
  _hidden = hidden;
  emit(hidden);
  onStateChanged();
}

export function resetNav() {
  _lastRouteChangeTime = Date.now();
  clearAutoShow();
  _locked = false;
  if (_hidden) {
    _hidden = false;
    emit(false);
  }
  if (_collapsed) {
    _collapsed = false;
    emitCollapsed(false);
  }
  setNavScrollOffset(0);
  onStateChanged();
}

export function useNavHidden(): boolean {
  const [hidden, setHidden] = useState(_hidden);
  useEffect(() => {
    _listeners.add(setHidden);
    return () => {
      _listeners.delete(setHidden);
    };
  }, []);
  return hidden;
}

// ─── navCollapsed ── scroll-driven collapse to a floating pill/circle ───
// Driven by useScrollHide. Separate from navHidden so preset-editor hides
// never interfere with the scroll-collapse visual.
let _collapsed = false;
const _collapsedListeners = new Set<(c: boolean) => void>();

function emitCollapsed(c: boolean) {
  _collapsedListeners.forEach((fn) => fn(c));
}

export function setNavCollapsed(collapsed: boolean) {
  if (_locked && !collapsed) return;
  if (_collapsed === collapsed) return;
  _collapsed = collapsed;
  if (typeof document !== 'undefined') {
    if (collapsed) {
      document.documentElement.setAttribute('data-nav-collapsed', 'true');
    } else {
      document.documentElement.removeAttribute('data-nav-collapsed');
    }
  }
  emitCollapsed(collapsed);
  onStateChanged();
}

export function useNavCollapsed(): boolean {
  const [c, setC] = useState(_collapsed);
  useEffect(() => {
    _collapsedListeners.add(setC);
    return () => {
      _collapsedListeners.delete(setC);
    };
  }, []);
  return c;
}

let _scrollOffset = 0;
const _scrollOffsetListeners = new Set<(o: number) => void>();

export function getNavScrollOffset(): number {
  return _scrollOffset;
}

export function setNavScrollOffset(offset: number) {
  if (_locked) return;
  const clamped = Math.max(0, Math.min(1, offset));
  if (_scrollOffset === clamped) return;
  _scrollOffset = clamped;
  _scrollOffsetListeners.forEach((fn) => fn(clamped));
}

export function useNavScrollOffset(): number {
  const [offset, setOffset] = useState(_scrollOffset);
  useEffect(() => {
    _scrollOffsetListeners.add(setOffset);
    return () => {
      _scrollOffsetListeners.delete(setOffset);
    };
  }, []);
  return offset;
}

const _elementLastY = new WeakMap<HTMLElement, number>();

export function useScrollHide(ref: React.RefObject<HTMLElement | null>, dependency?: any) {
  // Signature preserved, global capturing scroll listener handles all scroll hide/show.
  useEffect(() => {
    const recordInteraction = () => {
      _lastInteractionTime = Date.now();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('touchstart', recordInteraction, { passive: true });
      window.addEventListener('pointerdown', recordInteraction, { passive: true });
      window.addEventListener('wheel', recordInteraction, { passive: true });
      window.addEventListener('keydown', recordInteraction, { passive: true });
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('touchstart', recordInteraction);
        window.removeEventListener('pointerdown', recordInteraction);
        window.removeEventListener('wheel', recordInteraction);
        window.removeEventListener('keydown', recordInteraction);
      }
    };
  }, [ref, dependency]);
}

// ─── Watchdog Recovery System & Diagnostics ───────────────────────────────

export function onStateChanged() {
  // Watchdog recovery removed. All navigation updates are pure event-driven.
}

// Global Event-driven bindings
if (typeof window !== 'undefined') {
  try {
    let lastActiveRoute: string | null = null;

    // Subscribe to navigation store state changes
    useNavigationStore.subscribe((state) => {
      const activeRoute = state.history[state.history.length - 1];
      const activeRouteStr = activeRoute ? JSON.stringify(activeRoute) : 'null';

      // Auto-reset collapsed/hidden states on route changes
      if (activeRouteStr !== lastActiveRoute) {
        lastActiveRoute = activeRouteStr;
        resetNav();
      }
    });

    // App Resume failsafes: restore navigation visibility upon focus or visibility restore
    window.addEventListener('focus', () => {
      resetNav();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        resetNav();
      }
    });

    // Configuration / Layout failsafes: restore navigation visibility upon resize or orientation changes
    window.addEventListener('resize', () => {
      resetNav();
    });
    window.addEventListener('orientationchange', () => {
      resetNav();
    });

    // Global Scroll Listener in Capture Phase
    const recordInteraction = () => {
      _lastInteractionTime = Date.now();
    };

    window.addEventListener('touchstart', recordInteraction, { passive: true });
    window.addEventListener('pointerdown', recordInteraction, { passive: true });
    window.addEventListener('wheel', recordInteraction, { passive: true });
    window.addEventListener('keydown', recordInteraction, { passive: true });

    const globalScrollHandler = (e: Event) => {
      // Resolve the scrolling element
      const el = (e.target === document ? document.documentElement : e.target) as HTMLElement;
      if (!el || typeof el.scrollTop !== 'number') return;

      // Ignore tiny scrollable elements (like small menus, selects, etc.)
      if (el.clientHeight < 250 || el.scrollHeight < el.clientHeight + 40) {
        return;
      }

      const y = el.scrollTop;
      const maxScroll = el.scrollHeight - el.clientHeight;

      // Ignore overscroll bounce
      if (y < 0 || y > maxScroll) {
        return;
      }

      // Expand navigation immediately when near the top (within 40px)
      if (y < 40) {
        setNavScrollOffset(0);
        if (_collapsed) {
          setNavCollapsed(false);
        }
        _elementLastY.set(el, y);
        return;
      }

      // Guard: ignore scroll if route changed within last 800ms
      if (Date.now() - _lastRouteChangeTime < 800) {
        _elementLastY.set(el, y);
        return;
      }

      // Guard: ignore scroll if transition state is not IDLE
      if (useApplicationTransitionStore.getState().state !== 'IDLE') {
        _elementLastY.set(el, y);
        return;
      }

      // Only collapse or slide if the scroll event is user-initiated (e.g. within 1200ms of input)
      const isUserScroll = (Date.now() - _lastInteractionTime) < 1200;
      if (!isUserScroll) {
        _elementLastY.set(el, y);
        return;
      }

      const prevY = _elementLastY.get(el) ?? y;
      const dy = y - prevY;

      // Ignore large jumps (e.g. scroll restoration, content load layout shifts)
      if (Math.abs(dy) > 80) {
        _elementLastY.set(el, y);
        return;
      }

      // Jitter filter: ignore scroll updates smaller than 2px
      if (Math.abs(dy) < 2) {
        return;
      }

      // Progressive translation: 75px total scroll delta triggers complete hide/show transition.
      const deltaRatio = dy / 75;
      setNavScrollOffset(_scrollOffset + deltaRatio);

      const shouldCollapse = dy > 0;
      if (_collapsed !== shouldCollapse && (!_locked || !shouldCollapse)) {
        setNavCollapsed(shouldCollapse);
      }

      _elementLastY.set(el, y);
    };

    window.addEventListener('scroll', globalScrollHandler, { capture: true, passive: true });
  } catch (e) {
    // Passive safety guard
  }
}
