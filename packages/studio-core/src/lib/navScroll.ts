import { useState, useEffect, useRef } from 'react';
import { useNavigationStore } from '../store/useNavigationStore';

// ─── navHidden — programmatic full-hide (preset editor, modals, etc.) ────────
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

// ─── navCollapsed — scroll-driven collapse to a floating pill/circle ─────────
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

// ─── useScrollHide — attach to any scrollable container ──────────────────────
// On scroll-down → collapse the nav to a floating circle (setNavCollapsed).
// On scroll-up or near top → expand back.
// Callers that need a full programmatic hide should use setNavHidden() directly.
export function useScrollHide(ref: React.RefObject<HTMLElement | null>, dependency?: any) {
  const lastY = useRef(0);
  useEffect(() => {
    let el = ref.current;
    let onScroll: (() => void) | null = null;
    
    const attachScrollListener = (target: HTMLElement) => {
      onScroll = () => {
        const y = target.scrollTop;
        const maxScroll = target.scrollHeight - target.clientHeight;

        // Ignore overscroll / rubber-banding boundaries (iOS/Mac bounce)
        if (y < 0 || y > maxScroll) {
          return;
        }

        // Expand navigation immediately when near the top (within 40px)
        if (y < 40) {
          if (_collapsed) {
            setNavCollapsed(false);
          }
          lastY.current = y;
          return;
        }

        const dy = y - lastY.current;
        
        // Jitter filter: ignore scroll updates smaller than 8px
        if (Math.abs(dy) < 8) {
          return;
        }

        const shouldCollapse = dy > 0;
        if (_collapsed !== shouldCollapse && (!_locked || !shouldCollapse)) {
          setNavCollapsed(shouldCollapse);
        }

        lastY.current = y;
      };
      target.addEventListener('scroll', onScroll, { passive: true });
    };

    if (el) {
      attachScrollListener(el);
    } else {
      let attempts = 0;
      const interval = setInterval(() => {
        el = ref.current;
        attempts++;
        if (el) {
          clearInterval(interval);
          attachScrollListener(el);
        } else if (attempts > 30) {
          clearInterval(interval);
        }
      }, 50);
      
      return () => {
        clearInterval(interval);
      };
    }
    
    return () => {
      if (el && onScroll) {
        el.removeEventListener('scroll', onScroll);
      }
    };
  }, [ref, dependency]);
}

// ─── Watchdog Recovery System ────────────────────────────────────────────────
let _watchdogTimer: ReturnType<typeof setTimeout> | null = null;

function clearWatchdogTimer() {
  if (_watchdogTimer) {
    clearTimeout(_watchdogTimer);
    _watchdogTimer = null;
  }
}

export function onStateChanged() {
  try {
    if (typeof window === 'undefined') return;

    // Check if we are currently hidden
    if (!_hidden) {
      clearWatchdogTimer();
      return;
    }

    // Check if a transition is running
    const isTransitioning = useNavigationStore.getState().isTransitioning;
    if (isTransitioning) {
      clearWatchdogTimer();
      return;
    }

    // Check for active HTML5 fullscreen mode
    const isHtml5Fullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
    if (isHtml5Fullscreen) {
      clearWatchdogTimer();
      return;
    }

    // Check for custom application fullscreen view overlays
    const hasFullscreenView = !!(
      document.querySelector('.live-mode-view') ||
      document.querySelector('[data-testid="live-close"]') ||
      document.querySelector('[data-testid="custom-chord-save-btn"]') ||
      document.querySelector('[data-testid="generate-progression-btn"]') ||
      Array.from(document.querySelectorAll('div')).some(el => {
        const z = window.getComputedStyle(el).zIndex;
        return z && !isNaN(Number(z)) && Number(z) >= 100000;
      })
    );
    if (hasFullscreenView) {
      clearWatchdogTimer();
      return;
    }

    // Start recovery timer if not already active
    if (!_watchdogTimer) {
      _watchdogTimer = setTimeout(() => {
        _watchdogTimer = null;
        
        // Re-verify all conditions before triggering recovery
        const stillTransitioning = useNavigationStore.getState().isTransitioning;
        const stillHtml5Fullscreen = !!(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement
        );
        const stillHasFullscreenView = !!(
          document.querySelector('.live-mode-view') ||
          document.querySelector('[data-testid="live-close"]') ||
          document.querySelector('[data-testid="custom-chord-save-btn"]') ||
          document.querySelector('[data-testid="generate-progression-btn"]') ||
          Array.from(document.querySelectorAll('div')).some(el => {
            const z = window.getComputedStyle(el).zIndex;
            return z && !isNaN(Number(z)) && Number(z) >= 100000;
          })
        );
        
        if (_hidden && !stillTransitioning && !stillHtml5Fullscreen && !stillHasFullscreenView) {
          console.warn('[Recovery] BottomNavigationRecoveryTriggered: stuck hidden state recovered.');
          resetNav();
        }
      }, 3000);
    }
  } catch (e) {
    // Passive safety guard during early app boot
  }
}

// Event-driven bindings
if (typeof window !== 'undefined') {
  try {
    // Subscribe to navigation store transition changes
    useNavigationStore.subscribe(() => onStateChanged());

    // Observe body mutations for fullscreen overlay mounting/unmounting
    const observer = new MutationObserver(() => {
      onStateChanged();
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


