import React, { useEffect } from 'react';
import {
  useNavHidden,
  useNavCollapsed,
  useNavScrollOffset,
  useBottomNavigationStore,
  useApplicationTransitionStore,
  useNavigationStore,
  useSettingsStore,
} from '@workspace/studio-core';
import { SharedNavigationBar } from './SharedNavigationBar';

if (typeof window !== 'undefined') {
  (window as any).__navMetrics = (window as any).__navMetrics || {
    mounts: 0,
    unmounts: 0,
    fallbackActivations: 0,
    recoveries: 0,
    itemRebuilds: 0,
    controllerRecreations: 0,
  };
}

export function BottomNavigationController() {
  const hidden = useNavHidden();
  const collapsed = useNavCollapsed();
  const scrollOffset = useNavScrollOffset();
  const transitionState = useApplicationTransitionStore((s) => s.state);
  const launchingApp = useApplicationTransitionStore((s) => s.launchingApp);

  const settings = useSettingsStore((s) => s.settings);
  const isLight =
    settings.theme === 'light' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: light)').matches);

  const { setCollapsed, setVisible, setMotionState, setIsLight } =
    useBottomNavigationStore();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__navMetrics.controllerRecreations++;
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const interval = setInterval(() => {
      const store = useBottomNavigationStore.getState();
      const isTransitioning = useApplicationTransitionStore.getState().state !== 'IDLE';
      
      if (!store.visible && !isTransitioning) {
        const hasHideClass = document.querySelector('.hide-bottom-nav') || document.querySelector('.hide-global-nav');
        const isFullscreen = !!document.fullscreenElement;
        
        if (!hasHideClass && !isFullscreen) {
          (window as any).__navMetrics.fallbackActivations++;
          (window as any).__navMetrics.recoveries++;
          store.setVisible(true);
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Dynamically resolve bottom nav items light mode state
  useEffect(() => {
    setIsLight(isLight);
  }, [isLight, setIsLight]);

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
