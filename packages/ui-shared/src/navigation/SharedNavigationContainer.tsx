import React, { useState, useEffect } from 'react';

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

  // Render both views if transitioning, with the correct layout/layering order.
  const activeViews = [visibleView];
  if (exitingView !== null && exitingView !== visibleView) {
    activeViews.push(exitingView);
  }

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{ ...style }}
    >
      {activeViews.map(viewId => {
        const isVisible = visibleView === viewId;
        const isExiting = exitingView === viewId;
        const isEntering = isVisible && exitingView !== null;

        let animClass = '';
        if (isEntering) {
          animClass = resolvedDir === 'right' ? 'panel-enter-right' : 'panel-enter-left';
        } else if (isExiting) {
          animClass = resolvedDir === 'right' ? 'panel-exit-left' : 'panel-exit-right';
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
            }}
          >
            {children(viewId)}
          </div>
        );
      })}
    </div>
  );
}
