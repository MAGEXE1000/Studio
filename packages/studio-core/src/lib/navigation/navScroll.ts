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

// ─── navCollapsed ── (Obsolete - Purged) ───
export function setNavCollapsed(_collapsed: boolean) {}

export function useNavCollapsed(): boolean {
  return false;
}

export function getNavScrollOffset(): number {
  return 0;
}

export function setNavScrollOffset(_offset: number) {}

export function useNavScrollOffset(): number {
  return 0;
}

export function useScrollHide(_ref?: React.RefObject<HTMLElement | null>, _dependency?: any) {
  // No-op: Scroll hide animation completely purged.
}

// ─── Watchdog Recovery System & Diagnostics ───────────────────────────────

let _hiddenStartTime = 0;

export function onStateChanged() {
  // Reset hidden start baseline on explicit state changes
  if (!_hidden) {
    _hiddenStartTime = 0;
  } else if (_hiddenStartTime === 0) {
    _hiddenStartTime = Date.now();
  }
}

function runWatchdogCheck() {
  if (typeof window === 'undefined') return;
  const now = Date.now();

  // 1. Auto-recover if hidden unexpectedly for >2000ms without lock
  if (_hidden && !_locked) {
    if (_hiddenStartTime > 0 && now - _hiddenStartTime >= 2000) {
      _hidden = false;
      _hiddenStartTime = 0;
      emit(false);
      if ((window as any).__navMetrics) {
        (window as any).__navMetrics.fallbackActivations++;
        (window as any).__navMetrics.recoveries++;
      }
    }
  } else if (!_hidden) {
    _hiddenStartTime = 0;
  }

  // 2. Failsafe DOM presence audit
  const wrapper = document.querySelector('.shared-bottom-nav-container-wrapper') as HTMLElement | null;
  if (wrapper) {
    const style = window.getComputedStyle(wrapper);
    if ((style.display === 'none' || style.visibility === 'hidden') && !_locked && !_hidden) {
      resetNav();
    }
  }
}

if (typeof window !== 'undefined') {
  setInterval(runWatchdogCheck, 2000);
}

// Global Event-driven bindings
if (typeof window !== 'undefined') {
  try {
    let lastActiveRoute: string | null = null;

    // Subscribe to navigation store state changes
    useNavigationStore.subscribe((state) => {
      const activeRoute = state.history[state.history.length - 1];
      const activeRouteStr = activeRoute ? JSON.stringify(activeRoute) : 'null';

      // Auto-reset hidden states on route changes
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
