import React, { useEffect } from 'react';
import {
  useNavHidden,
  useNavCollapsed,
  useNavScrollOffset,
  useBottomNavigationStore,
  useApplicationTransitionStore,
} from '@workspace/studio-core';
import { SharedNavigationBar } from './SharedNavigationBar';

export function BottomNavigationController() {
  const hidden = useNavHidden();
  const collapsed = useNavCollapsed();
  const scrollOffset = useNavScrollOffset();
  const transitionState = useApplicationTransitionStore((s) => s.state);
  const launchingApp = useApplicationTransitionStore((s) => s.launchingApp);

  const { visible, items, setCollapsed, setVisible, setMotionState } = useBottomNavigationStore();

  // Sync programmatic visibility and collapse states
  useEffect(() => {
    setVisible(!hidden);
  }, [hidden, setVisible]);

  useEffect(() => {
    setCollapsed(collapsed);
  }, [collapsed, setCollapsed]);

  // Sync scroll offset state to Scrolling motion state
  useEffect(() => {
    if (scrollOffset > 0 && scrollOffset < 1) {
      setMotionState('Scrolling');
    } else if (scrollOffset === 1) {
      setMotionState('Hidden');
    } else if (scrollOffset === 0 && !hidden && !collapsed) {
      setMotionState('Idle');
    }
  }, [scrollOffset, hidden, collapsed, setMotionState]);

  // Sync transition coordinator states
  useEffect(() => {
    if (transitionState !== 'IDLE') {
      if (launchingApp === 'hub') {
        setMotionState('ReturningToHub');
      } else {
        setMotionState('Transitioning');
      }
    } else {
      setMotionState(hidden ? 'Hidden' : collapsed ? 'Hidden' : 'Idle');
    }
  }, [transitionState, launchingApp, hidden, collapsed, setMotionState]);

  // Filter out rendering on Desktop web views
  const isWeb = typeof window !== 'undefined' && !(window as any).Capacitor?.isNativePlatform?.();
  if (isWeb && typeof window !== 'undefined' && window.innerWidth > 768) {
    return null;
  }

  return <SharedNavigationBar />;
}
