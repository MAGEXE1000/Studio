import { useState, useEffect, useRef } from 'react';
import { useNavigationStore } from './useNavigationStore';
import { useApplicationTransitionStore } from './useApplicationTransitionStore';

let _lastRouteChangeTime = 0;

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

const _registeredScrollElements = new Set<HTMLElement>();
const _elementListeners = new WeakMap<HTMLElement, () => void>();
const _elementLastY = new WeakMap<HTMLElement, number>();

export function useScrollHide(ref: React.RefObject<HTMLElement | null>, dependency?: any) {
  const lastElementRef = useRef<HTMLElement | null>(null);
  const mountTimeRef = useRef<number>(0);
  const lastInteractionTimeRef = useRef<number>(0);

  const disabled = dependency === true || (dependency && typeof dependency === 'object' && (dependency as any).disabled === true);

  useEffect(() => {
    const recordInteraction = () => {
      lastInteractionTimeRef.current = Date.now();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('touchstart', recordInteraction, { passive: true });
      window.addEventListener('pointerdown', recordInteraction, { passive: true });
      window.addEventListener('wheel', recordInteraction, { passive: true });
      window.addEventListener('keydown', recordInteraction, { passive: true });
    }

    const unbindEvents = (prev: HTMLElement) => {
      _registeredScrollElements.delete(prev);
      const listener = _elementListeners.get(prev);
      if (listener) {
        prev.removeEventListener('scroll', listener);
        _elementListeners.delete(prev);
      }
      _elementLastY.delete(prev);
    };

    if (disabled) {
      if (lastElementRef.current) {
        unbindEvents(lastElementRef.current);
        lastElementRef.current = null;
      }
      return;
    }

    const checkAndBind = () => {
      const el = ref.current;
      if (el === lastElementRef.current) return;

      // Clean up previous element if it changed
      if (lastElementRef.current) {
        unbindEvents(lastElementRef.current);
      }

      lastElementRef.current = el;

      if (el) {
        _registeredScrollElements.add(el);
        mountTimeRef.current = Date.now();

        const onScroll = () => {
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

          // Guard against initial scroll adjustments or restoration within the first 500ms
          const timeSinceMount = Date.now() - mountTimeRef.current;
          if (timeSinceMount < 500) {
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
          const isUserScroll = (Date.now() - lastInteractionTimeRef.current) < 1200;
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

          // Jitter filter: ignore scroll updates smaller than 2px for immediate responsiveness
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

        _elementLastY.set(el, el.scrollTop);
        _elementListeners.set(el, onScroll);
        el.addEventListener('scroll', onScroll, { passive: true });

        onStateChanged();
      }
    };

    checkAndBind();

    // Fallback for late mounting elements
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (!ref.current) {
      timer = setTimeout(checkAndBind, 150);
    }

    return () => {
      if (timer) clearTimeout(timer);
      const el = lastElementRef.current;
      if (el) {
        unbindEvents(el);
        lastElementRef.current = null;
        resetNav();
      }
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
  } catch (e) {
    // Passive safety guard
  }
}
