import React, { useEffect, useCallback } from 'react';
import {
  useNavHidden,
  useNavCollapsed,
  useNavScrollOffset,
  useBottomNavigationStore,
  useApplicationTransitionStore,
  useNavigationStore,
  NavigationDispatcher,
  APP_SECTIONS,
  useSettingsStore,
} from '@workspace/studio-core';
import { SharedNavigationBar } from './SharedNavigationBar';

export function BottomNavigationController() {
  const hidden = useNavHidden();
  const collapsed = useNavCollapsed();
  const scrollOffset = useNavScrollOffset();
  const transitionState = useApplicationTransitionStore((s) => s.state);
  const launchingApp = useApplicationTransitionStore((s) => s.launchingApp);

  const history = useNavigationStore((s) => s.history);
  const currentRoute = history[history.length - 1] || { app: 'hub' };
  const currentApp = currentRoute.app || 'hub';
  const activeTab = currentRoute.tab || currentRoute.page || 'home';
  const activePage = currentRoute.page || 'main';

  const settings = useSettingsStore((s) => s.settings);
  const isLight =
    settings.theme === 'light' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: light)').matches);

  const { setCollapsed, setVisible, setMotionState, setItems, setIsLight } =
    useBottomNavigationStore();

  const rebuildItems = useCallback(() => {
    if (currentApp === 'hub') {
      setItems([
        {
          key: 'notifications',
          icon: 'notifications',
          label: 'Activity',
          isActive: activeTab === 'settings' && activePage === 'notifications',
          onClick: () =>
            NavigationDispatcher.push({ app: 'hub', tab: 'settings', page: 'notifications' }),
        },
        {
          key: 'home',
          icon: 'home',
          label: 'Home',
          isActive: activeTab === 'home',
          onClick: () => NavigationDispatcher.push({ app: 'hub', tab: 'home', page: 'main' }),
        },
        {
          key: 'settings',
          icon: 'settings',
          label: 'Settings',
          isActive: activeTab === 'settings' && activePage !== 'notifications',
          onClick: () => NavigationDispatcher.push({ app: 'hub', tab: 'settings', page: 'main' }),
        },
      ]);
      return;
    }

    const sections = APP_SECTIONS[currentApp] || [];
    const formattedItems = sections.map((sec) => ({
      key: sec.id,
      icon: sec.icon,
      label: sec.labelKey,
      isActive: activeTab === sec.id || activePage === sec.id,
      onClick: () =>
        NavigationDispatcher.push({ app: currentApp as any, page: sec.id as any, tab: sec.id }),
    }));

    setItems(formattedItems);
  }, [currentApp, activeTab, activePage, setItems]);

  // Dynamically resolve bottom nav items for active application scope
  useEffect(() => {
    setIsLight(isLight);
    rebuildItems();
  }, [isLight, setIsLight, rebuildItems]);

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

  // Self-healing recovery mechanism
  const performRecovery = useCallback(() => {
    // 1. Detect if keyboard is focused (covering navigation)
    let isKeyboardFocused = false;
    if (typeof document !== 'undefined') {
      const activeEl = document.activeElement;
      if (activeEl) {
        const tagName = activeEl.tagName.toLowerCase();
        isKeyboardFocused =
          tagName === 'input' ||
          tagName === 'textarea' ||
          activeEl.hasAttribute('contenteditable') ||
          (activeEl as HTMLElement).isContentEditable;
      }
    }

    // 2. Detect if fullscreen mode is active
    const isFullscreen = typeof document !== 'undefined' && !!document.fullscreenElement;

    // 3. Detect if an explicit modal is open that requests hidden nav
    const isModalOpen =
      typeof document !== 'undefined' &&
      (document.querySelector('.modal-backdrop') !== null ||
        document.querySelector('.studio-modal') !== null ||
        document.querySelector('[role="dialog"]') !== null);

    // 4. Check if the app is currently in transition
    const isTransitioning = transitionState !== 'IDLE';

    // 5. Check programmatic hidden state (from useNavHidden() store)
    const isProgrammaticallyHidden = hidden;

    // Check if we should hide bottom navigation
    const shouldHide =
      isKeyboardFocused ||
      isFullscreen ||
      isModalOpen ||
      isTransitioning ||
      isProgrammaticallyHidden;

    // Get current store values
    const store = useBottomNavigationStore.getState();

    // If it shouldn't be hidden, enforce visible = true and rebuild items if empty
    if (!shouldHide) {
      if (!store.visible) {
        store.setVisible(true);
      }
      if (!store.items || store.items.length === 0) {
        rebuildItems();
      }
    } else {
      // If it should be hidden, make sure visible is synced to false
      if (store.visible) {
        store.setVisible(false);
      }
    }
  }, [transitionState, hidden, rebuildItems]);

  // Periodic heartbeat watchdog check every 1000ms
  useEffect(() => {
    const interval = setInterval(() => {
      performRecovery();
    }, 1000);
    return () => clearInterval(interval);
  }, [performRecovery]);

  // Event-driven recovery on interactions
  useEffect(() => {
    const handler = () => performRecovery();
    window.addEventListener('focusin', handler);
    window.addEventListener('focusout', handler);
    window.addEventListener('click', handler, { passive: true });
    window.addEventListener('touchstart', handler, { passive: true });
    window.addEventListener('resize', handler);

    return () => {
      window.removeEventListener('focusin', handler);
      window.removeEventListener('focusout', handler);
      window.removeEventListener('click', handler);
      window.removeEventListener('touchstart', handler);
      window.removeEventListener('resize', handler);
    };
  }, [performRecovery]);

  // Filter out rendering on Desktop web views
  const isWeb = typeof window !== 'undefined' && !(window as any).Capacitor?.isNativePlatform?.();
  if (isWeb && typeof window !== 'undefined' && window.innerWidth > 768) {
    return null;
  }

  return <SharedNavigationBar />;
}
