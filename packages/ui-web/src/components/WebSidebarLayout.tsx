import { useChordStore, ACCENT_COLORS, useT, type AuthUser, useAppUpdate, APP_VERSION_LABEL, useStudioPreferences, useNavigationStore, NavigationDispatcher, useSettingsStore, authRepository, REGISTERED_APPS } from "@workspace/studio-core";
import { StudioLogo, ChordexLogo, DrumexLogo, StagexLogoIcon, GroovexLogo, VocalexLogo } from "@workspace/ui-shared";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { useSidebar, Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarRail } from "./StudioSidebar";

function SidebarLabel({ children, open }: { children: React.ReactNode; open: boolean }) {
  const { preferences } = useStudioPreferences();
  const isReduced = preferences.reduceMotion;
  return (
    <motion.span
      initial={false}
      animate={{
        opacity: open ? 1 : 0,
        x: open ? 0 : -8,
        width: open ? 'auto' : 0,
        marginLeft: open ? 0 : -12,
      }}
      transition={isReduced ? { duration: 0 } : { duration: 0.15, ease: 'easeOut' }}
      className="truncate"
      style={{ display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden' }}
    >
      {children}
    </motion.span>
  );
}

export default function WebSidebarLayout({ shouldHideSidebar }: { shouldHideSidebar: boolean }) {
  const settings = useSettingsStore((s) => s.settings);
  const currentApp = useNavigationStore((s) => s.history[s.history.length - 1]?.app ?? 'hub');

  const { open, toggleSidebar } = useSidebar();
  const { preferences } = useStudioPreferences();
  const isReduced = preferences.reduceMotion;
  const t = useT();
  const updater = useAppUpdate();

  const handleToggleSidebar = () => {
    if (currentApp !== 'hub' && settings.autoHideSidebarInApps) {
      window.dispatchEvent(new CustomEvent('studio:hide-sidebar-temp'));
    } else {
      toggleSidebar();
    }
  };

  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [customPhoto, setCustomPhoto] = useState<string | null>(null);

  const [activeHubTab, setActiveHubTab] = useState<'home' | 'settings' | 'profile'>('home');
  const [activeSettingsPage, setActiveSettingsPage] = useState<string>('main');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const profileMenuBtnStyle = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 10px',
    borderRadius: '8px',
    background: 'transparent',
    border: 'none',
    color: 'var(--c-text-primary)',
    fontSize: '12.5px',
    fontWeight: 600,
    fontFamily: 'Manrope, sans-serif',
    cursor: 'pointer',
    textAlign: 'left',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'background-color 150ms ease',
  } as React.CSSProperties;

  // Listen for Hub tab active state and settings page active state
  useEffect(() => {
    const onHubTabActive = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) {
        setActiveHubTab(detail as any);
      }
    };
    const onSettingsPageActive = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) {
        setActiveSettingsPage(detail);
      }
    };
    window.addEventListener('studio:hub-tab-active', onHubTabActive);
    window.addEventListener('studio:settings-page-active', onSettingsPageActive);

    // Also read initial routing/page if set in session
    const savedPage = sessionStorage.getItem('studio:routeToSettingsPage');
    if (savedPage) {
      setActiveSettingsPage(savedPage);
    }

    return () => {
      window.removeEventListener('studio:hub-tab-active', onHubTabActive);
      window.removeEventListener('studio:settings-page-active', onSettingsPageActive);
    };
  }, []);

  // Subscribe to Authentication state
  useEffect(() => {
    return authRepository.subscribeAuth((user) => {
      setAuthUser(user);
    });
  }, []);

  // Subscribe to Profile Photo updates
  useEffect(() => {
    if (!authUser?.uid) {
      setCustomPhoto(null);
      return;
    }
    try {
      const stored = localStorage.getItem(`chordex_cp_${authUser.uid}`);
      setCustomPhoto(stored || null);
    } catch {
      setCustomPhoto(null);
    }

    const onCoverChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ uid: string; cover: string | null }>).detail;
      if (detail && detail.uid === authUser.uid) {
        setCustomPhoto(detail.cover);
      }
    };
    window.addEventListener('chordex:user-cover-changed', onCoverChanged);
    return () => {
      window.removeEventListener('chordex:user-cover-changed', onCoverChanged);
    };
  }, [authUser?.uid]);

  // Click outside to close profile popover menu
  useEffect(() => {
    if (!showProfileMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  // Determine active accent color
  const activeVis = settings.perApp?.[currentApp ?? 'hub'] ?? {
    theme: settings.theme ?? 'dark',
    accentColor: settings.accentColor ?? 'blue',
    amoledMode: settings.amoledMode ?? false,
  };
  const accent = ACCENT_COLORS[activeVis.accentColor] ?? ACCENT_COLORS.blue;

  // Navigation handlers
  const handleGoToHub = (tab: 'home' | 'settings' | 'profile' | 'help') => {
    NavigationDispatcher.closeApp();
    window.dispatchEvent(new CustomEvent('studio:set-hub-tab', { detail: tab }));
    if (tab === 'settings') {
      sessionStorage.setItem('studio:routeToSettingsPage', 'main');
      window.dispatchEvent(new CustomEvent('studio:update-settings-page', { detail: 'main' }));
    }
  };

  const handleGoToSettingsPage = (page: string) => {
    NavigationDispatcher.closeApp();
    window.dispatchEvent(new CustomEvent('studio:set-hub-tab', { detail: 'settings' }));
    sessionStorage.setItem('studio:routeToSettingsPage', page);
    window.dispatchEvent(new CustomEvent('studio:update-settings-page', { detail: page }));
  };

  const handleLaunchApp = (app: 'chordex' | 'drumex' | 'stagex' | 'groovex' | 'vocalex') => {
    NavigationDispatcher.openApp(app);
  };

  const handleSetChordexPanel = (panel: 'songs' | 'library' | 'chord') => {
    NavigationDispatcher.push({ app: 'chordex', page: panel });
  };

  // User details
  const name = authUser?.displayName || authUser?.email || '';
  const email = authUser?.email || '';
  const photo = customPhoto || authUser?.photoURL;
  const initial = (name[0] ?? 'S').toUpperCase();

  // Helper variables to pass accent color styling dynamically
  const accentVars = {
    '--studio-accent-from': accent.from,
    '--studio-accent-to': accent.to,
  } as React.CSSProperties;

  return (
    <Sidebar shouldHideSidebar={shouldHideSidebar} style={accentVars}>
      {/* Header */}
      <SidebarHeader>
        <div
          className="flex items-center gap-3 overflow-hidden cursor-pointer text-[var(--c-text-primary)]"
          onClick={() => handleGoToHub('home')}
        >
          <div className="flex-shrink-0">
            <StudioLogo size={28} />
          </div>
          <motion.span
            initial={false}
            animate={{ opacity: open ? 1 : 0, x: open ? 0 : -8 }}
            transition={isReduced ? { duration: 0 } : { duration: 0.15, ease: 'easeOut' }}
            className="font-extrabold text-base tracking-tight text-[var(--c-text-primary)]"
            style={{
              fontFamily: 'Manrope, sans-serif',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            Studio
          </motion.span>
        </div>
      </SidebarHeader>

      {/* Main content scroll */}
      <SidebarContent>
        {/* Studio Apps Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Studio Apps</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                active={currentApp === 'hub'}
                onClick={() => handleGoToHub('home')}
                tooltip="Hub Home"
              >
                <div className="flex-shrink-0" style={{ opacity: currentApp === 'hub' ? 1 : 0.65 }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 20, display: 'block' }}
                  >
                    home
                  </span>
                </div>
                <SidebarLabel open={open}>Studio Hub</SidebarLabel>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {REGISTERED_APPS.map((app) => (
              <SidebarMenuItem key={app.id}>
                <SidebarMenuButton
                  active={currentApp === app.id}
                  onClick={() => handleLaunchApp(app.id as any)}
                  tooltip={app.labelKey}
                >
                  <div className="flex-shrink-0">
                    {(() => {
                      switch (app.id) {
                        case 'chordex':
                          return <ChordexLogo size={20} />;
                        case 'drumex':
                          return <DrumexLogo size={20} />;
                        case 'stagex':
                          return <StagexLogoIcon size={20} />;
                        case 'groovex':
                          return <GroovexLogo size={20} />;
                        case 'vocalex':
                          return <VocalexLogo size={20} />;
                        default:
                          return (
                            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                              {app.icon}
                            </span>
                          );
                      }
                    })()}
                  </div>
                  <SidebarLabel open={open}>{app.labelKey}</SidebarLabel>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <SidebarMenu style={{ position: 'relative' }}>
          {/* User Profile */}
          <SidebarMenuItem className="relative">
            <div ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-full flex items-center gap-2.5 p-1.5 overflow-hidden rounded-xl border-none text-left cursor-pointer transition-colors bg-transparent hover:bg-[var(--sidebar-hover-bg)] outline-none"
                style={{ outline: 'none' }}
              >
                <div
                  className="flex-shrink-0"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: photo
                      ? 'transparent'
                      : 'var(--profile-avatar-bg, rgba(255, 255, 255, 0.08))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 800,
                    color: 'var(--profile-avatar-color, #ffffff)',
                    overflow: 'hidden',
                    boxShadow: 'var(--profile-avatar-border, 0 0 0 1px rgba(255, 255, 255, 0.12))',
                  }}
                >
                  {photo ? (
                    <img
                      src={photo}
                      alt=""
                      referrerPolicy="no-referrer"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : authUser ? (
                    <span>{initial}</span>
                  ) : (
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: 20,
                        color: 'var(--profile-avatar-color, var(--c-text-primary))',
                      }}
                    >
                      account_circle
                    </span>
                  )}
                </div>

                <motion.div
                  initial={false}
                  animate={{
                    opacity: open ? 1 : 0,
                    x: open ? 0 : -8,
                    width: open ? 'auto' : 0,
                    marginLeft: open ? 0 : -10,
                  }}
                  transition={isReduced ? { duration: 0 } : { duration: 0.15, ease: 'easeOut' }}
                  className="flex-1 min-w-0"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span
                    className="truncate font-bold text-xs text-[var(--c-text-primary)]"
                    style={{ fontFamily: 'Manrope, sans-serif' }}
                  >
                    {authUser ? authUser.displayName || 'Studio User' : 'Guest User'}
                  </span>
                  <span className="truncate text-[10px] text-[var(--c-text-secondary)] font-medium">
                    {authUser ? email : 'Not signed in'}
                  </span>
                </motion.div>

                <motion.span
                  initial={false}
                  animate={{ opacity: open ? 0.7 : 0, scale: open ? 1 : 0.8 }}
                  transition={isReduced ? { duration: 0 } : { duration: 0.15 }}
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 16,
                    color: 'var(--c-text-secondary)',
                    marginLeft: 'auto',
                    flexShrink: 0,
                  }}
                >
                  more_vert
                </motion.span>
              </button>

              {/* Profile Popover Menu */}
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: open ? '0px' : '50%',
                      transform: open ? 'none' : 'translateX(-50%)',
                      marginBottom: '8px',
                      width: '216px',
                      background: 'var(--popover-bg, rgba(18, 18, 18, 0.75))',
                      backdropFilter: 'blur(30px)',
                      WebkitBackdropFilter: 'blur(30px)',
                      border: '1px solid rgba(128, 128, 128, 0.15)',
                      borderRadius: '16px',
                      padding: '8px',
                      zIndex: 100,
                      boxShadow: 'var(--popover-shadow, 0 10px 30px rgba(0,0,0,0.5))',
                      overflow: 'hidden',
                    }}
                  >
                    {/* User info header */}
                    <div
                      style={{
                        padding: '8px 10px 10px',
                        borderBottom: '1px solid rgba(128,128,128,0.08)',
                        marginBottom: '6px',
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'var(--c-text-primary)',
                          fontFamily: 'Manrope',
                        }}
                        className="truncate"
                      >
                        {authUser ? authUser.displayName || 'Studio User' : 'Guest User'}
                      </p>
                      <p
                        style={{
                          margin: '2px 0 0',
                          fontSize: 10.5,
                          color: 'var(--c-text-secondary)',
                          fontFamily: 'Inter',
                        }}
                        className="truncate"
                      >
                        {authUser ? email : 'Not signed in'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button
                        onClick={() => {
                          handleGoToSettingsPage('profile');
                          setShowProfileMenu(false);
                        }}
                        style={profileMenuBtnStyle}
                        className="btn-smooth hover:bg-[var(--sidebar-hover-bg)]"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          person
                        </span>
                        <span>Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          handleGoToSettingsPage('general');
                          setShowProfileMenu(false);
                        }}
                        style={profileMenuBtnStyle}
                        className="btn-smooth hover:bg-[var(--sidebar-hover-bg)]"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          settings
                        </span>
                        <span>Settings</span>
                      </button>

                      <button
                        onClick={() => {
                          handleGoToSettingsPage('release-notes');
                          setShowProfileMenu(false);
                        }}
                        style={profileMenuBtnStyle}
                        className="btn-smooth hover:bg-[var(--sidebar-hover-bg)]"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          article
                        </span>
                        <span>Release Notes</span>
                      </button>

                      <button
                        onClick={() => {
                          handleGoToHub('help');
                          setShowProfileMenu(false);
                        }}
                        style={profileMenuBtnStyle}
                        className="btn-smooth hover:bg-[var(--sidebar-hover-bg)]"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          help
                        </span>
                        <span>Help & Support</span>
                      </button>

                      {authUser ? (
                        <>
                          <div
                            style={{
                              height: 1,
                              background: 'rgba(128,128,128,0.08)',
                              margin: '4px 0',
                            }}
                          />
                          <button
                            onClick={() => {
                              authRepository.signOut();
                              setShowProfileMenu(false);
                            }}
                            style={{ ...profileMenuBtnStyle, color: '#ef4444' }}
                            className="btn-smooth hover:bg-[rgba(239,68,68,0.08)]"
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: 16, color: '#ef4444' }}
                            >
                              logout
                            </span>
                            <span>Log out</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <div
                            style={{
                              height: 1,
                              background: 'rgba(128,128,128,0.08)',
                              margin: '4px 0',
                            }}
                          />
                          <button
                            onClick={() => {
                              handleGoToSettingsPage('profile');
                              setShowProfileMenu(false);
                            }}
                            style={profileMenuBtnStyle}
                            className="btn-smooth hover:bg-[var(--sidebar-hover-bg)]"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                              login
                            </span>
                            <span>Sign in</span>
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
