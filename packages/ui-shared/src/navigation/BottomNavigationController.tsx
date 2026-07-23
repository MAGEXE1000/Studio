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
  useBackHandler,
} from '@workspace/studio-core';
import { SharedNavigationBar } from './SharedNavigationBar';
import { IconSongs, IconLibrary, IconSettings } from '../components/icons/NavIcons';
import { motion, AnimatePresence } from 'motion/react';

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

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  useBackHandler(
    'overlay',
    () => {
      if (isProfileMenuOpen) {
        setIsProfileMenuOpen(false);
        return true;
      }
      return false;
    },
    [isProfileMenuOpen]
  );

  const currentRoute = useNavigationStore((s) => s.history[s.history.length - 1]);

  useEffect(() => {
    setIsProfileMenuOpen(false);
  }, [currentRoute]);

  useEffect(() => {
    if (isSwitcherOpen) {
      setIsProfileMenuOpen(false);
    }
  }, [isSwitcherOpen]);
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
        const isSearchInput = activeEl.id === 'global-search-input';
        setIsKeyboardFocused(
          (!isSearchInput && tagName === 'input') ||
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
          onClick: () => {
            NavigationDispatcher.push({ app: 'hub', tab: 'profile', page: 'notifications' });
            setIsProfileMenuOpen(false);
          },
        },
        {
          key: 'home',
          icon: 'home',
          label: 'Home',
          isActive: activeTab === 'home',
          onClick: () => {
            NavigationDispatcher.push({ app: 'hub', tab: 'home', page: 'main' });
            setIsProfileMenuOpen(false);
          },
        },
        {
          key: 'profile',
          icon: profileIcon,
          label: 'Profile',
          isActive: (activeTab === 'profile' && activePage !== 'notifications') || activeTab === 'settings',
          onClick: () => setIsProfileMenuOpen((prev) => !prev),
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
            setIsProfileMenuOpen(false);
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
        onClick: () => {
          NavigationDispatcher.push({ app: currentApp as any, page: sec.id as any, tab: sec.id as any });
          setIsProfileMenuOpen(false);
        },
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
    <>
      <SharedNavigationBar
        items={computedItems}
        isLight={isLight}
        visible={visible}
        collapsed={collapsed}
        isSwitcherOpen={isSwitcherOpen}
        setIsSwitcherOpen={setIsSwitcherOpen}
        currentApp={currentApp}
      />
      <AnimatePresence>
        {isProfileMenuOpen && (
          <motion.div
            key="profile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onPointerDown={() => setIsProfileMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              zIndex: 2000,
              backdropFilter: 'blur(2px)',
            }}
          />
        )}
        {isProfileMenuOpen && (
          <motion.div
            key="profile-menu-card"
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            style={{
              position: 'fixed',
              bottom: 84,
              right: 16,
              width: 280,
              background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(28, 28, 30, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: 16,
              border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
              zIndex: 2001,
              padding: '16px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px 12px', borderBottom: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(128,128,128,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(128,128,128,0.08)' }}>
                {customPhoto || user?.photoURL ? (
                  <img
                    src={customPhoto || user?.photoURL || ''}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'var(--c-text-secondary)' }}>
                    person
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontFamily: 'var(--font-headline)' }}>
                  {user?.displayName || 'Guest User'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--c-text-secondary)', opacity: 0.8, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}>
                  {user?.email || 'guest@livex.studio'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* View Profile */}
              <button
                onClick={() => {
                  NavigationDispatcher.push({ app: 'hub', tab: 'profile', page: 'profile' });
                  setIsProfileMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--c-text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 13.5,
                  fontFamily: 'var(--font-body)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--c-text-secondary)' }}>
                  person
                </span>
                View Profile
              </button>

              {/* Settings */}
              <button
                onClick={() => {
                  NavigationDispatcher.push({ app: 'hub', tab: 'settings', page: 'main' });
                  setIsProfileMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--c-text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 13.5,
                  fontFamily: 'var(--font-body)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--c-text-secondary)' }}>
                  settings
                </span>
                Settings
              </button>

              {/* Sign Out */}
              <button
                onClick={() => {
                  void authRepository.signOut();
                  setIsProfileMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 13.5,
                  fontFamily: 'var(--font-body)',
                  borderTop: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.08)',
                  marginTop: 4,
                  paddingTop: 14,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#ef4444' }}>
                  logout
                </span>
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
