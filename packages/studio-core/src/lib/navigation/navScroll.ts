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
  _scrollOffset = 0;
  _scrollOffsetListeners.forEach((fn) => fn(0));
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

// ─── navScrollOffset ── scroll-driven 40% center-scale animation offset ───
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

export function setNavCollapsed(_collapsed: boolean) {}

export function useNavCollapsed(): boolean {
  return false;
}

const _registeredScrollElements = new Set<HTMLElement>();
const _elementListeners = new WeakMap<HTMLElement, () => void>();
const _elementLastY = new WeakMap<HTMLElement, number>();

export function useScrollHide(ref: React.RefObject<HTMLElement | null>, dependency?: any) {
  const lastElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const checkAndBind = () => {
      const el = ref.current;
      if (el === lastElementRef.current) return;

      if (lastElementRef.current) {
        const prev = lastElementRef.current;
        _registeredScrollElements.delete(prev);
        const listener = _elementListeners.get(prev);
        if (listener) {
          prev.removeEventListener('scroll', listener);
          _elementListeners.delete(prev);
        }
        _elementLastY.delete(prev);
      }

      lastElementRef.current = el;

      if (el) {
        _registeredScrollElements.add(el);

        const onScroll = () => {
          const y = el.scrollTop;
          const maxScroll = el.scrollHeight - el.clientHeight;

          if (y < 0 || y > maxScroll) return;

          if (y < 30) {
            setNavScrollOffset(0);
            _elementLastY.set(el, y);
            return;
          }

          const prevY = _elementLastY.get(el) ?? y;
          const dy = y - prevY;

          if (Math.abs(dy) < 2) return;

          const deltaRatio = dy / 60;
          setNavScrollOffset(_scrollOffset + deltaRatio);
          _elementLastY.set(el, y);
        };

        _elementLastY.set(el, el.scrollTop);
        _elementListeners.set(el, onScroll);
        el.addEventListener('scroll', onScroll, { passive: true });
      }
    };

    checkAndBind();

    let rafId: number | null = null;
    if (!ref.current) {
      rafId = requestAnimationFrame(checkAndBind);
    }

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      const el = lastElementRef.current;
      if (el) {
        _registeredScrollElements.delete(el);
        const listener = _elementListeners.get(el);
        if (listener) {
          el.removeEventListener('scroll', listener);
          _elementListeners.delete(el);
        }
        _elementLastY.delete(el);
        lastElementRef.current = null;
      }
    };
  }, [ref, dependency]);
}

// ─── Watchdog Recovery System & Diagnostics ───────────────────────────────

let _hiddenStartTime = 0;

export function onStateChanged() {
  if (!_hidden) {
    _hiddenStartTime = 0;
  } else if (_hiddenStartTime === 0) {
    _hiddenStartTime = Date.now();
  }
}

function runWatchdogCheck() {
  if (typeof window === 'undefined') return;
  const now = Date.now();

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

    useNavigationStore.subscribe((state) => {
      const activeRoute = state.history[state.history.length - 1];
      const activeRouteStr = activeRoute ? JSON.stringify(activeRoute) : 'null';

      if (activeRouteStr !== lastActiveRoute) {
        lastActiveRoute = activeRouteStr;
        resetNav();
      }
    });

    window.addEventListener('focus', () => {
      resetNav();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        resetNav();
      }
    });

    window.addEventListener('resize', () => {
      resetNav();
    });
    window.addEventListener('orientationchange', () => {
      resetNav();
    });

    // Window-level body scroll & touch capturing listener for universal app scrolling
    let lastWindowY = window.scrollY;
    let lastTouchY = 0;

    window.addEventListener(
      'touchstart',
      (e: TouchEvent) => {
        if (e.touches[0]) {
          lastTouchY = e.touches[0].clientY;
        }
      },
      { passive: true, capture: true }
    );

    window.addEventListener(
      'touchmove',
      (e: TouchEvent) => {
        if (!e.touches[0]) return;
        const y = e.touches[0].clientY;
        const dy = lastTouchY - y; // positive when scrolling down
        if (Math.abs(dy) < 4) return;
        lastTouchY = y;
        const deltaRatio = dy / 80;
        setNavScrollOffset(_scrollOffset + deltaRatio);
      },
      { passive: true, capture: true }
    );

    window.addEventListener(
      'scroll',
      () => {
        const y = window.scrollY || document.documentElement.scrollTop;
        if (y < 30) {
          setNavScrollOffset(0);
          lastWindowY = y;
          return;
        }
        const dy = y - lastWindowY;
        if (Math.abs(dy) < 2) return;
        const deltaRatio = dy / 60;
        setNavScrollOffset(_scrollOffset + deltaRatio);
        lastWindowY = y;
      },
      { passive: true }
    );
  } catch (e) {
    // Passive safety guard
  }
}
