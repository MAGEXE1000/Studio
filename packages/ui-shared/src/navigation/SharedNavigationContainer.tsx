import React, { useState, useEffect } from 'react';
import { useRenderProfiler } from '@workspace/studio-core';
import { PerformanceProfiler } from '../profiling/PerformanceProfiler';

interface SharedNavigationContainerProps {
  activeView: string;
  direction?: 'right' | 'left';
  viewOrder?: readonly string[] | string[];
  children: (viewId: string) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function SharedNavigationContainer({
  activeView,
  direction,
  viewOrder,
  children,
  className = '',
  style,
}: SharedNavigationContainerProps) {
  const [visibleView, setVisibleView] = useState<string>(activeView);
  const [exitingView, setExitingView] = useState<string | null>(null);
  const [resolvedDir, setResolvedDir] = useState<'right' | 'left'>('right');
  const [visitedViews, setVisitedViews] = useState<Set<string>>(() => new Set([activeView]));

  useRenderProfiler('SharedNavigationContainer', { activeView, direction, viewOrder, className, style }, { visibleView, exitingView, resolvedDir });

  useEffect(() => {
    setVisitedViews(prev => {
      if (prev.has(activeView)) return prev;
      const next = new Set(prev);
      next.add(activeView);
      return next;
    });
  }, [activeView]);

  useEffect(() => {
    if (activeView !== visibleView) {
      let dir: 'right' | 'left' = 'right';
      if (direction) {
        dir = direction;
      } else if (viewOrder) {
        const oldIdx = viewOrder.indexOf(visibleView);
        const newIdx = viewOrder.indexOf(activeView);
        if (oldIdx !== -1 && newIdx !== -1) {
          dir = newIdx >= oldIdx ? 'right' : 'left';
        }
      }
      setResolvedDir(dir);
      setExitingView(visibleView);
      setVisibleView(activeView);
    }
  }, [activeView, visibleView, direction, viewOrder]);

  useEffect(() => {
    if (exitingView === null) return;
    const timer = setTimeout(() => {
      setExitingView(null);
    }, 320);
    return () => clearTimeout(timer);
  }, [exitingView]);

  // Keep visited views in the DOM (keep-alive) to preserve their states/scroll positions,
  // falling back to active/exiting views if viewOrder is not supplied.
  const renderList = viewOrder
    ? viewOrder.filter(viewId => visitedViews.has(viewId))
    : [visibleView].concat(exitingView !== null && exitingView !== visibleView ? [exitingView] : []);

  return (
    <PerformanceProfiler id="SharedNavigationContainer">
      <div
        className={`relative w-full h-full overflow-hidden ${className}`}
        style={{ ...style }}
      >
        {renderList.map(viewId => {
        const isVisible = visibleView === viewId;
        const isExiting = exitingView === viewId;
        const isEntering = isVisible && exitingView !== null;

        const show = isVisible || isExiting;

        let animClass = '';
        if (isEntering) {
          animClass = resolvedDir === 'right' ? 'panel-enter-right' : 'panel-enter-left';
        } else if (isExiting) {
          animClass = resolvedDir === 'right' ? 'panel-exit-left' : 'panel-exit-right';
        }

        let zIndex = 1;
        if (isEntering) {
          zIndex = resolvedDir === 'right' ? 2 : 1;
        } else if (isExiting) {
          zIndex = resolvedDir === 'right' ? 1 : 2;
        }

        return (
          <div
            key={viewId}
            className={animClass}
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: isVisible && !isExiting ? 'auto' : 'none',
              width: '100%',
              height: '100%',
              display: show ? 'block' : 'none',
              zIndex,
              backgroundColor: 'var(--app-bg, var(--c-bg-primary, #000))',
            }}
          >
            {children(viewId)}
          </div>
        );
      })}
      </div>
    </PerformanceProfiler>
  );
}
