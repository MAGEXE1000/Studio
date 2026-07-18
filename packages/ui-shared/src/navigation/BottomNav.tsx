import { useChordStore, ACCENT_COLORS, type ActivePanel, type AppKey, useNavHidden, useNavCollapsed, useT, useLiquidGlassNav, useIsWebDesktop, useNavigationStore, NavigationDispatcher, setNavCollapsed } from '@workspace/studio-core';
import { useEffect, useRef } from 'react';
import { SharedBottomNavigation, type SharedBottomNavItem } from './SharedBottomNavigation';

const NAV_ORDER: ActivePanel[] = ['songs', 'library', 'chord', 'settings'];

export default function BottomNav() {
  const isWebDesktop = useIsWebDesktop();
  const settings = useChordStore(s => s.settings);
  const t = useT();

  const activeRoute = useNavigationStore(s => s.history[s.history.length - 1]) || { app: 'hub', tab: 'home' };
  let activePanel: ActivePanel = 'library';
  if (activeRoute.app === 'chords') {
    activePanel = (activeRoute.page as ActivePanel) || 'library';
  } else if (activeRoute.app === 'hub' && activeRoute.tab === 'settings') {
    activePanel = 'settings';
  }

  const navHidden = useNavHidden();
  const navCollapsed = useNavCollapsed();
  const navRef = useRef<HTMLElement | null>(null);

  // Wire this nav into the shared liquid-glass renderer
  useLiquidGlassNav(navRef);

  useEffect(() => {
    setNavCollapsed(false);
  }, [activePanel]);

  if (isWebDesktop) return null;
  if (settings.appMode !== 'chords') return null;
  if (navHidden || navCollapsed) return null;

  const isLight = settings.theme === 'light' || (settings.theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches);

  const items: SharedBottomNavItem[] = [
    {
      key: 'songs',
      icon: 'music_note',
      label: t.nav.songs,
      isActive: activePanel === 'songs',
      onClick: () => NavigationDispatcher.push({ app: 'chords', page: 'songs' }),
    },
    {
      key: 'library',
      icon: 'library_music',
      label: t.nav.library,
      isActive: activePanel === 'library',
      onClick: () => NavigationDispatcher.push({ app: 'chords', page: 'library' }),
    },
    {
      key: 'chord',
      icon: 'grid_on',
      label: t.nav.chords,
      isActive: activePanel === 'chord',
      onClick: () => NavigationDispatcher.push({ app: 'chords', page: 'chord' }),
    },
    {
      key: 'settings',
      icon: 'settings',
      label: t.nav.settings,
      isActive: activePanel === 'settings',
      onClick: () => NavigationDispatcher.push({ app: 'hub', tab: 'settings', page: 'main' }),
    },
  ];

  return <SharedBottomNavigation items={items} isLight={isLight} />;
}
