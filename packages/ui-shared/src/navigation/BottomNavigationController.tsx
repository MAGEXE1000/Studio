import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  useNavHidden,
  useNavCollapsed,
  useNavScrollOffset,
  useBottomNavigationStore,
  useApplicationTransitionStore,
  useNavigationStore,
  useSettingsStore,
  useT,
  APP_SECTIONS,
  NavigationDispatcher,
  authRepository,
  getUserAvatar,
  subscribeUserAvatar,
} from '@workspace/studio-core';
import { SharedNavigationBar } from './SharedNavigationBar';
import { IconSongs, IconLibrary, IconSettings } from '../components/icons/NavIcons';

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
  const isTransitioning = transitionState !== 'IDLE';

  const settings = useSettingsStore((s) => s.settings);
  const isLight =
    settings.theme === 'light' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: light)').matches);

  const { setCollapsed, setVisible, setMotionState, setIsLight } =
    useBottomNavigationStore();

  const isSwitcherOpen = useBottomNavigationStore((s) => s.isSwitcherOpen);
  const setIsSwitcherOpen = useCallback((open: boolean) => {
    useBottomNavigationStore.getState().setSwitcherOpen(open);
  }, []);

  const currentRoute = useNavigationStore((s) => s.history[s.history.length - 1]);
  const currentApp = currentRoute?.app ?? 'hub';
  const activeTab = currentRoute?.tab || currentRoute?.page || 'home';
  const activePage = currentRoute?.page || 'main';

  const t = useT() as any;
  const getTranslation = useCallback((key: string) => {
    if (!t) return key;
    if (key === 'songs') return t.navigation?.songs || 'Songs';
    if (key === 'library') return t.navigation?.library || 'Library';
    if (key === 'settings') return t.navigation?.settings || 'Preferences';
    if (key === 'chords') return t.navigation?.chords || 'Chords';
    if (key === 'drumSongs') return t.navigation?.drumSongs || 'Songs';
    if (key === 'drumPatterns') return t.navigation?.drumPatterns || 'Patterns';
    if (key === 'drumPreferences') return t.navigation?.drumPreferences || 'Preferences';
    if (key === 'groovexLibrary') return t.navigation?.groovexLibrary || 'Library';
    if (key === 'groovexPreferences') return t.navigation?.groovexPreferences || 'Preferences';
    if (key === 'vocalexCoach') return t.navigation?.vocalexCoach || 'Coach';
    if (key === 'vocalexRecorder') return t.navigation?.vocalexRecorder || 'Recorder';
    if (key === 'vocalexTakes') return t.navigation?.vocalexTakes || 'Takes';
    if (key === 'vocalexPreferences') return t.navigation?.vocalexPreferences || 'Preferences';
    if (key === 'stagexStage') return t.navigation?.stagexStage || 'Stage';
    if (key === 'stagexSetup') return t.navigation?.stagexSetup || 'Setup';
    if (key === 'stagexPreferences') return t.navigation?.stagexPreferences || 'Preferences';
    return key;
  }, [t]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__navMetrics.controllerRecreations++;
    }
  }, []);

  // Subscribe to user and avatar details
  const [user, setUser] = useState<any>(null);
  const [avatarIcon, setAvatarIcon] = useState<string | null>(null);
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);

  useEffect(() => {
    return authRepository.subscribeAuth((u: any) => {
      setUser(u);
    });
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setAvatarIcon(null);
      setCustomPhoto(null);
      return;
    }
    const refresh = () => setAvatarIcon(getUserAvatar(user.uid));
    refresh();
    const unsubAvatar = subscribeUserAvatar(refresh);

    try {
      const stored = localStorage.getItem(`chordex_cp_${user.uid}`);
      setCustomPhoto(stored || null);
    } catch {
      setCustomPhoto(null);
    }

    const onCoverChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ uid: string; cover: string | null }>).detail;
      if (detail && detail.uid === user.uid) {
        setCustomPhoto(detail.cover);
      }
    };
    window.addEventListener('chordex:user-cover-changed', onCoverChanged);

    return () => {
      unsubAvatar();
      window.removeEventListener('chordex:user-cover-changed', onCoverChanged);
    };
  }, [user]);

  const profileIcon = useMemo(() => {
    const effectivePhoto = customPhoto || user?.photoURL;
    if (avatarIcon) {
      return (
        <span className="material-symbols-outlined" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1", display: 'block' }}>
          {avatarIcon}
        </span>
      );
    }
    if (effectivePhoto) {
      return (
        <img
          src={effectivePhoto}
          alt=""
          style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
          referrerPolicy="no-referrer"
        />
      );
    }
    return (
      <span className="material-symbols-outlined" style={{ fontSize: 22, display: 'block' }}>
        person
      </span>
    );
  }, [user, avatarIcon, customPhoto]);

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

  // Compute visibility reactively based on DOM focus and indicators
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const checkKeyboard = () => {
      const activeEl = document.activeElement;
      if (activeEl) {
        const tagName = activeEl.tagName.toLowerCase();
        setIsKeyboardFocused(
          tagName === 'input' ||
          tagName === 'textarea' ||
          activeEl.hasAttribute('contenteditable') ||
          (activeEl as HTMLElement).isContentEditable
        );
      } else {
        setIsKeyboardFocused(false);
      }
    };
    window.addEventListener('focusin', checkKeyboard);
    window.addEventListener('focusout', checkKeyboard);
    window.addEventListener('click', checkKeyboard, { passive: true });
    window.addEventListener('touchstart', checkKeyboard, { passive: true });
    window.addEventListener('resize', checkKeyboard);
    return () => {
      window.removeEventListener('focusin', checkKeyboard);
      window.removeEventListener('focusout', checkKeyboard);
      window.removeEventListener('click', checkKeyboard);
      window.removeEventListener('touchstart', checkKeyboard);
      window.removeEventListener('resize', checkKeyboard);
    };
  }, []);

  const [hasDOMHiddenIndicator, setHasDOMHiddenIndicator] = useState(false);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const checkDOM = () => {
      const isFullscreen = !!document.fullscreenElement;
      const isModalOpen =
        document.querySelector('.modal-backdrop') !== null ||
        document.querySelector('.studio-modal') !== null ||
        document.querySelector('[role="dialog"]') !== null;
      const hasHideClass =
        document.querySelector('.hide-bottom-nav') !== null ||
        document.querySelector('.hide-global-nav') !== null;
      setHasDOMHiddenIndicator(isFullscreen || isModalOpen || hasHideClass);
    };
    
    checkDOM();
    const interval = setInterval(checkDOM, 500);

    window.addEventListener('click', checkDOM, { passive: true });
    window.addEventListener('touchstart', checkDOM, { passive: true });
    window.addEventListener('resize', checkDOM);

    return () => {
      clearInterval(interval);
      window.removeEventListener('click', checkDOM);
      window.removeEventListener('touchstart', checkDOM);
      window.removeEventListener('resize', checkDOM);
    };
  }, []);

  const lastAppRef = useRef<string | null>(null);

  // Compute navigation items synchronously from route history & registry definitions
  const computedItems = useMemo(() => {
    if (currentApp !== lastAppRef.current) {
      lastAppRef.current = currentApp;
      if (typeof window !== 'undefined') {
        (window as any).__navMetrics.itemRebuilds++;
      }
    }

    if (currentApp === 'hub') {
      return [
        {
          key: 'notifications',
          icon: 'notifications',
          label: 'Activity',
          isActive: activeTab === 'profile' && activePage === 'notifications',
          onClick: () =>
            NavigationDispatcher.push({ app: 'hub', tab: 'profile', page: 'notifications' }),
        },
        {
          key: 'home',
          icon: 'home',
          label: 'Home',
          isActive: activeTab === 'home',
          onClick: () => NavigationDispatcher.push({ app: 'hub', tab: 'home', page: 'main' }),
        },
        {
          key: 'profile',
          icon: profileIcon,
          label: 'Profile',
          isActive: activeTab === 'profile' && activePage !== 'notifications',
          onClick: () => NavigationDispatcher.push({ app: 'hub', tab: 'profile', page: 'profile' }),
        },
      ];
    }

    if (currentApp === 'chords') {
      const sections = APP_SECTIONS.chords || [];
      return sections.map((sec) => {
        const isActive = activeTab === sec.id || activePage === sec.id;
        let iconElement: React.ReactNode;
        if (sec.id === 'songs') {
          iconElement = <IconSongs active={isActive} />;
        } else if (sec.id === 'library') {
          iconElement = <IconLibrary active={isActive} />;
        } else if (sec.id === 'settings') {
          iconElement = <IconSettings active={isActive} />;
        } else {
          iconElement = sec.icon;
        }

        return {
          key: sec.id,
          icon: iconElement,
          label: getTranslation(sec.labelKey),
          isActive,
          onClick: () => {
            NavigationDispatcher.push({ app: 'chords', page: sec.id as any, tab: sec.id as any });
          },
        };
      });
    }

    const sections = APP_SECTIONS[currentApp] || [];
    return sections.map((sec) => {
      let isActive = activeTab === sec.id || activePage === sec.id;
      if (currentApp === 'stage') {
        if (sec.id === 'Editor') {
          isActive = ['Editor', 'Export'].includes(activeTab) || ['Editor', 'Export'].includes(activePage);
        } else if (sec.id === 'Setup') {
          isActive = ['Setup', 'SetupHub', 'Rider', 'Setlist', 'Gear', 'Members'].includes(activeTab) ||
                     ['Setup', 'SetupHub', 'Rider', 'Setlist', 'Gear', 'Members'].includes(activePage);
        } else if (sec.id === 'Preferences') {
          isActive = ['Preferences', 'Assistant'].includes(activeTab) || ['Preferences', 'Assistant'].includes(activePage);
        }
      }
      return {
        key: sec.id,
        icon: sec.icon,
        label: getTranslation(sec.labelKey),
        isActive,
        onClick: () =>
          NavigationDispatcher.push({ app: currentApp as any, page: sec.id as any, tab: sec.id as any }),
      };
    });
  }, [currentApp, activeTab, activePage, getTranslation]);

  // Filter out rendering on Desktop web views
  const isWeb = typeof window !== 'undefined' && !(window as any).Capacitor?.isNativePlatform?.();
  if (isWeb && typeof window !== 'undefined' && window.innerWidth > 768) {
    return null;
  }

  const visible = !isKeyboardFocused && !hasDOMHiddenIndicator && useBottomNavigationStore.getState().visible;

  return (
    <SharedNavigationBar
      items={computedItems}
      isLight={isLight}
      visible={visible}
      collapsed={collapsed}
      isSwitcherOpen={isSwitcherOpen}
      setIsSwitcherOpen={setIsSwitcherOpen}
      currentApp={currentApp}
    />
  );
}
