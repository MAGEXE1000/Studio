import { useState, useEffect, useRef } from 'react';
import { useNavigationStore } from './useNavigationStore';

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
  if (collapsed) return; // Always ignore collapsing to keep Bottom Navigation fully visible.
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

export function useScrollHide(ref: React.RefObject<HTMLElement | null>, dependency?: any) {
  // No-op to prevent scroll-driven collapse
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
  } catch (e) {
    // Passive safety guard
  }
}
