import { useState, useEffect, useRef } from 'react';
import { useNavigationStore } from './useNavigationStore';

// â”€â”€â”€ navHidden â€” programmatic full-hide (preset editor, modals, etc.) â”€â”€â”€â”€â”€â”€â”€â”€
let _hidden = false;
let _locked = false;
const _listeners = new Set<(h: boolean) => void>();

const AUTO_SHOW_MS = 4000;
let _autoShowTimer: ReturnType<typeof setTimeout> | null = null;

function clearAutoShow() {
  if (_autoShowTimer) { clearTimeout(_autoShowTimer); _autoShowTimer = null; }
}
function emit(hidden: boolean) { _listeners.forEach(fn => fn(hidden)); }

export function setNavLocked(locked: boolean) {
  if (_locked === locked) return;
  _locked = locked;
  if (!locked) {
    clearAutoShow();
    if (_hidden) { _hidden = false; emit(false); }
    // Also un-collapse when unlocking so the bar is always reachable.
    if (_collapsed) { _collapsed = false; emitCollapsed(false); }
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
  if (_hidden)    { _hidden    = false; emit(false); }
  if (_collapsed) { _collapsed = false; emitCollapsed(false); }
  onStateChanged();
}

export function useNavHidden(): boolean {
  const [hidden, setHidden] = useState(_hidden);
  useEffect(() => {
    _listeners.add(setHidden);
    return () => { _listeners.delete(setHidden); };
  }, []);
  return hidden;
}

// â”€â”€â”€ navCollapsed â€” scroll-driven collapse to a floating pill/circle â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Driven by useScrollHide. Separate from navHidden so preset-editor hides
// never interfere with the scroll-collapse visual.
let _collapsed = false;
const _collapsedListeners = new Set<(c: boolean) => void>();

function emitCollapsed(c: boolean) { _collapsedListeners.forEach(fn => fn(c)); }

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
    return () => { _collapsedListeners.delete(setC); };
  }, []);
  return c;
}

// â”€â”€â”€ useScrollHide â€” attach to any scrollable container â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// On scroll-down â†’ collapse the nav to a floating circle (setNavCollapsed).
// On scroll-up or near top â†’ expand back.
// Callers that need a full programmatic hide should use setNavHidden() directly.
const _registeredScrollElements = new Set<HTMLElement>();
const _elementListeners = new WeakMap<HTMLElement, () => void>();
const _elementLastY = new WeakMap<HTMLElement, number>();

export function useScrollHide(ref: React.RefObject<HTMLElement | null>, dependency?: any) {
  const lastElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const checkAndBind = () => {
      const el = ref.current;
      if (el === lastElementRef.current) return;

      // Clean up previous element if it changed
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
          
          // Ignore overscroll bounce
          if (y < 0 || y > maxScroll) {
            return;
          }

          // Expand navigation immediately when near the top (within 40px)
          if (y < 40) {
            if (_collapsed) {
              setNavCollapsed(false);
            }
            _elementLastY.set(el, y);
            return;
          }

          const prevY = _elementLastY.get(el) ?? y;
          const dy = y - prevY;

          // Jitter filter: ignore scroll updates smaller than 8px
          if (Math.abs(dy) < 8) {
            return;
          }

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
        _registeredScrollElements.delete(el);
        const listener = _elementListeners.get(el);
        if (listener) {
          el.removeEventListener('scroll', listener);
          _elementListeners.delete(el);
        }
        _elementLastY.delete(el);
        lastElementRef.current = null;
        onStateChanged();
      }
    };
  }, [ref, dependency]);
}

// â”€â”€â”€ Watchdog Recovery System & Diagnostics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let _watchdogTimer: ReturnType<typeof setTimeout> | null = null;

function clearWatchdogTimer() {
  if (_watchdogTimer) {
    clearTimeout(_watchdogTimer);
    _watchdogTimer = null;
  }
}

function logRecovery(reason: string, action: string, startTime: number) {
  try {
    const navStore = useNavigationStore.getState();
    const currentRoute = navStore.history[navStore.history.length - 1];
    const previousRoute = navStore.history[navStore.history.length - 2] ?? null;
    const duration = Date.now() - startTime;
    
    const diagnosticsInfo = {
      currentRoute: currentRoute ? JSON.stringify(currentRoute) : 'null',
      previousRoute: previousRoute ? JSON.stringify(previousRoute) : 'null',
      registeredScrollCount: _registeredScrollElements.size,
      collapsedState: _collapsed,
      transitionState: `isTransitioning=${navStore.isTransitioning}`,
      recoveryReason: reason,
      recoveryAction: action,
      recoveryDuration: `${duration}ms`
    };
    console.warn('[RecoveryDiagnostics]', diagnosticsInfo);
  } catch (e) {
    console.warn('[RecoveryDiagnostics] Failed to collect full diagnostics:', e);
  }
}

export function onStateChanged() {
  try {
    if (typeof window === 'undefined') return;

    // 1. Collapsed state self-healing check
    if (_collapsed) {
      let hasActiveScroll = false;
      let allNearTop = true;

      for (const el of _registeredScrollElements) {
        if (el.isConnected) {
          const isVisible = el.offsetHeight > 0 && el.offsetWidth > 0;
          if (isVisible) {
            hasActiveScroll = true;
            if (el.scrollTop >= 40) {
              allNearTop = false;
            }
          }
        }
      }

      // If no active visible scroll owner exists, or all of them are near top, auto-expand!
      if (!hasActiveScroll || allNearTop) {
        const startTime = Date.now();
        logRecovery(
          `Collapsed but hasActiveScroll=${hasActiveScroll}, allNearTop=${allNearTop}`,
          'setNavCollapsed(false)',
          startTime
        );
        setNavCollapsed(false);
        return;
      }
    }

    // 2. Hidden state self-healing check (deferred watch)
    clearWatchdogTimer();
    if (_hidden) {
      const startTime = Date.now();
      _watchdogTimer = setTimeout(() => {
        _watchdogTimer = null;
        
        const isTransitioning = useNavigationStore.getState().isTransitioning;
        if (isTransitioning) return;

        const isHtml5Fullscreen = !!(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement
        );
        if (isHtml5Fullscreen) return;

        const hasFullscreenView = !!(
          document.querySelector('.live-mode-view') ||
          document.querySelector('[data-testid="live-close"]') ||
          document.querySelector('[data-testid="custom-chord-save-btn"]') ||
          document.querySelector('[data-testid="generate-progression-btn"]')
        );
        if (hasFullscreenView) return;

        // Stuck hidden state
        logRecovery('Hidden state active but no fullscreen elements or transitions detected', 'resetNav()', startTime);
        resetNav();
      }, 200);
    }
  } catch (e) {
    // Passive safety guard during early app boot
  }
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
        
        clearWatchdogTimer();
        
        if (_collapsed) {
          setNavCollapsed(false);
        }
        if (_hidden) {
          _hidden = false;
          emit(false);
        }
      }
      
      onStateChanged();
    });

    // Observe body mutations for fullscreen overlay changes (lightweight check, no div scanning)
    const observer = new MutationObserver(() => {
      if (_hidden || _collapsed) {
        onStateChanged();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Listen to native browser fullscreen state updates
    document.addEventListener('fullscreenchange', onStateChanged);
    document.addEventListener('webkitfullscreenchange', onStateChanged);
    document.addEventListener('mozfullscreenchange', onStateChanged);
    document.addEventListener('MSFullscreenChange', onStateChanged);
  } catch (e) {
    // Passive safety guard
  }
}



