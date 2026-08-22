import React from 'react';
import { StudioPageTransition } from '../components/StudioPageTransition';
import { InspectorOverlayRenderer } from '../features/devtools/inspector';

interface SharedNavigationContainerProps {
  activeView: string;
  direction?: 'right' | 'left';
  viewOrder?: readonly string[] | string[];
  children: (viewId: string) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'slide' | 'fade-through' | 'drilldown' | 'tab';
  preMountViews?: string[];
}

export function SharedNavigationContainer({
  activeView,
  children,
  className = '',
  style,
  variant,
}: SharedNavigationContainerProps) {
  // If activeView is a sub-page/drilldown section (not 'main'), use drilldown transition by default
  const effectiveVariant = variant ?? (activeView !== 'main' ? 'drilldown' : 'tab');

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', ...style }}
    >
      <StudioPageTransition pageKey={activeView} variant={effectiveVariant}>
        {children(activeView)}
      </StudioPageTransition>
      <InspectorOverlayRenderer />
    </div>
  );
}
