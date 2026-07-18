import React, { useState, useEffect, useRef } from 'react';
import { useNavigationStore } from '@workspace/studio-core';

const KeepAliveView = React.memo(({ viewId, show, renderView }: { viewId: string, show: boolean, renderView: (id: string) => React.ReactNode }) => {
  return <>{renderView(viewId)}</>;
}, (prev, next) => {
  // Skip rendering if the view was hidden and remains hidden
  if (!prev.show && !next.show) return true;
  return false;
});

interface SharedNavigationContainerProps {
  activeView: string;
  direction?: 'right' | 'left';
  viewOrder?: readonly string[] | string[];
  children: (viewId: string) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'slide' | 'fade-through';
  preMountViews?: string[];
}

const safeRaf = (cb: () => void) => {
  if (typeof requestAnimationFrame === 'function') {
    return requestAnimationFrame(cb);
  }
  return setTimeout(cb, 16) as any;
};

const safeCaf = (id: any) => {
  if (typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(id);
  } else {
    clearTimeout(id);
  }
};

export function SharedNavigationContainer({
  activeView,
  direction,
  viewOrder,
  children,
  className = '',
  style,
  variant = 'fade-through',
  preMountViews,
}: SharedNavigationContainerProps) {
  const [visitedViews, setVisitedViews] = useState<Set<string>>(() => {
    const s = new Set([activeView]);
    if (preMountViews) {
      preMountViews.forEach(v => s.add(v));
    }
    return s;
  });
  
  // Track transition states mapping: viewId -> state class
  const [viewStates, setViewStates] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {
      [activeView]: 'm3-nav-active',
    };
    if (preMountViews) {
      preMountViews.forEach(v => {
        if (v !== activeView) {
          initial[v] = 'm3-nav-hidden';
        }
      });
    }
    return initial;
  });

  const transitionType = useNavigationStore(s => s.transitionType);
  
  const prevActiveViewRef = useRef<string>(activeView);
  const transitionTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  const animationFrameRef = useRef<any>(null);

  // Temporary development-mode assertions for transition stability
  if (process.env.NODE_ENV !== 'production') {
    const states = Object.values(viewStates);
    const activeCount = states.filter(s => s === 'm3-nav-active').length;
    const exitingCount = states.filter(s => s.startsWith('m3-nav-exit')).length;
    const enteringCount = states.filter(s => s.startsWith('m3-nav-enter')).length;

    if (activeCount > 1) {
      throw new Error(`[Assertion Failure] Multiple active views detected in SharedNavigationContainer: ${JSON.stringify(viewStates)}`);
    }
    if (exitingCount > 1) {
      throw new Error(`[Assertion Failure] Multiple exiting views detected: ${JSON.stringify(viewStates)}`);
    }
    if (enteringCount > 1) {
      throw new Error(`[Assertion Failure] Multiple entering views detected: ${JSON.stringify(viewStates)}`);
    }
  }

  // Keep visited views in the DOM (keep-alive)
  useEffect(() => {
    setVisitedViews(prev => {
      if (prev.has(activeView)) return prev;
      const next = new Set(prev);
      next.add(activeView);
      return next;
    });
  }, [activeView]);

  useEffect(() => {
    const prevActive = prevActiveViewRef.current;
    if (activeView === prevActive) return;
    prevActiveViewRef.current = activeView;

    // Determine motion direction
    let dir: 'right' | 'left' = 'right';
    if (transitionType === 'backward') {
      dir = 'left';
    } else if (transitionType === 'forward') {
      dir = 'right';
    } else if (direction) {
      dir = direction;
    } else if (viewOrder) {
      const oldIdx = viewOrder.indexOf(prevActive);
      const newIdx = viewOrder.indexOf(activeView);
      if (oldIdx !== -1 && newIdx !== -1) {
        dir = newIdx >= oldIdx ? 'right' : 'left';
      }
    }

    // Cancel pending animation frames
    if (animationFrameRef.current !== null) {
      safeCaf(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Cancel existing timers for clean state transition
    if (transitionTimersRef.current[prevActive]) {
      clearTimeout(transitionTimersRef.current[prevActive]);
      delete transitionTimersRef.current[prevActive];
    }
    if (transitionTimersRef.current[activeView]) {
      clearTimeout(transitionTimersRef.current[activeView]);
      delete transitionTimersRef.current[activeView];
    }

    const nextStates: Record<string, string> = {};

    // 1. Transition outgoing view to exit state
    const exitState = dir === 'right' ? 'm3-nav-exit-left' : 'm3-nav-exit-right';
    nextStates[prevActive] = exitState;

    // 2. Prepare incoming view offscreen (instant placement, no transition)
    const enterState = dir === 'right' ? 'm3-nav-enter-right' : 'm3-nav-enter-left';
    nextStates[activeView] = enterState;

    // 3. Immediately hide other views to avoid overlap or performance overhead
    Object.keys(viewStates).forEach(vId => {
      if (vId !== activeView && vId !== prevActive) {
        nextStates[vId] = 'm3-nav-hidden';
      }
    });

    setViewStates(prev => ({
      ...prev,
      ...nextStates,
    }));

    // 4. Force styles recalculation and animate entering view
    animationFrameRef.current = safeRaf(() => {
      animationFrameRef.current = safeRaf(() => {
        setViewStates(prev => ({
          ...prev,
          [activeView]: 'm3-nav-active',
        }));
        animationFrameRef.current = null;
      });
    });

    // 5. Hide exiting view after transition duration finishes
    transitionTimersRef.current[prevActive] = setTimeout(() => {
      setViewStates(prev => {
        if (prev[prevActive] === exitState) {
          return {
            ...prev,
            [prevActive]: 'm3-nav-hidden',
          };
        }
        return prev;
      });
      delete transitionTimersRef.current[prevActive];
    }, 300);

  }, [activeView, direction, viewOrder, transitionType]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        safeCaf(animationFrameRef.current);
      }
      Object.values(transitionTimersRef.current).forEach(t => clearTimeout(t));
    };
  }, []);

  const renderList = viewOrder
    ? viewOrder.filter(viewId => visitedViews.has(viewId))
    : Array.from(visitedViews);

  return (
    <div className={`m3-nav-container ${className}`} style={style}>
      <style dangerouslySetInnerHTML={{ __html: `
        .m3-nav-container {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        .m3-nav-panel {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background-color: var(--app-bg, var(--c-bg-primary, #000));
          will-change: transform, opacity;
          box-sizing: border-box;
        }
        
        /* Material 3 Motion Fade-Through transition engine */
        .m3-nav-active {
          opacity: 1;
          transform: scale(1) translate3d(0, 0, 0);
          z-index: 2;
          pointer-events: auto;
          transition: opacity 280ms cubic-bezier(0.2, 0, 0, 1), transform 280ms cubic-bezier(0.2, 0, 0, 1);
        }
        .m3-nav-exit-left {
          opacity: 0;
          transform: scale(0.96) translate3d(-16px, 0, 0);
          z-index: 1;
          pointer-events: none;
          transition: opacity 150ms cubic-bezier(0.2, 0, 0, 1), transform 150ms cubic-bezier(0.2, 0, 0, 1);
        }
        .m3-nav-exit-right {
          opacity: 0;
          transform: scale(0.96) translate3d(16px, 0, 0);
          z-index: 1;
          pointer-events: none;
          transition: opacity 150ms cubic-bezier(0.2, 0, 0, 1), transform 150ms cubic-bezier(0.2, 0, 0, 1);
        }
        .m3-nav-enter-left {
          opacity: 0;
          transform: scale(0.96) translate3d(-16px, 0, 0);
          z-index: 2;
          pointer-events: none;
          transition: none !important;
        }
        .m3-nav-enter-right {
          opacity: 0;
          transform: scale(0.96) translate3d(16px, 0, 0);
          z-index: 2;
          pointer-events: none;
          transition: none !important;
        }
        .m3-nav-hidden {
          display: none !important;
        }
      ` }} />
      {renderList.map(viewId => {
        const stateClass = viewStates[viewId] || 'm3-nav-hidden';
        const show = stateClass !== 'm3-nav-hidden';

        return (
          <div
            key={viewId}
            className={`m3-nav-panel ${stateClass}`}
          >
            <KeepAliveView viewId={viewId} show={show} renderView={children} />
          </div>
        );
      })}
    </div>
  );
}
