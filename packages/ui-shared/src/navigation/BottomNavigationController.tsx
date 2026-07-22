import React, { useEffect } from 'react';
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

  // Dynamically resolve bottom nav items for active application scope
  useEffect(() => {
    setIsLight(isLight);

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
  }, [currentApp, activeTab, activePage, isLight, setItems, setIsLight]);

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
