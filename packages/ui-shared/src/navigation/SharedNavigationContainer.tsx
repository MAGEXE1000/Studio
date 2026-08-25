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
  variant = 'tab',
}: SharedNavigationContainerProps) {
  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', ...style }}
    >
      <StudioPageTransition pageKey={activeView} variant={variant}>
        {children(activeView)}
      </StudioPageTransition>
      <InspectorOverlayRenderer />
    </div>
  );
}
