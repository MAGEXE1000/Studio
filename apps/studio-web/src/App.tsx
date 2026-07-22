import { lazy, Suspense, useCallback, useEffect, useRef, useState, memo } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useChordStore, ACCENT_COLORS, useIsWebDesktop, useStudioPreferences, logActivity, resetNav, setNavHidden, setNavLocked, NavigationDispatcher, useNavigationStore, type ActivePanel, navDiagnosticsRegistry, type AppKey, useApplicationTransitionStore, ThemeTransitionEngine, useSettingsStore } from '@workspace/studio-core';

import {
  SmartLoading,
  StudioHubSkeleton,
  VocalexTakesSkeleton,
  GroovexAppSkeleton,
  StagexPanelSkeleton,
  DrumEditorSkeleton,
  ChordexPanelSkeleton,
  ChordexLogo,
  DrumexLogo,
  StagexLogoIcon,
  GroovexLogo,
  VocalexLogo,
  AppEntryTransition,
  ErrorBoundary,
  SharedNavigationContainer,
  ScreenScaffold,
  ApplicationTransitionEngine,
  StudioHub,
} from '@workspace/ui-shared';

const LibraryPanel = lazy(() => import('@workspace/ui-shared').then((m) => ({ default: m.LibraryPanel })));
const SettingsPanel = lazy(() => import('@workspace/ui-shared').then((m) => ({ default: m.SettingsPanel })));
const SongsPanel = lazy(() => import('@workspace/ui-shared').then((m) => ({ default: m.SongsPanel })));
const DrumEditor = lazy(() => import('@workspace/ui-shared').then((m) => ({ default: m.DrumEditor })));
const GroovexApp = lazy(() => import('@workspace/ui-shared').then((m) => ({ default: m.GroovexApp })));
const VocalexApp = lazy(() => import('@workspace/ui-shared').then((m) => ({ default: m.VocalexApp })));
const StageCorePanel = lazy(() => import('@workspace/ui-shared').then((m) => ({ default: m.StageCorePanel })));

import {
  WebSidebarLayout,
  SidebarProvider,
  SidebarInset,
  useSidebar,
  WebAppSectionDock,
  StudioLandingPage,
} from '@workspace/ui-web';

import './index.css';



function SidebarHoverSync({ hoverShowSidebar }: { hoverShowSidebar: boolean }) {
  const { setOpen } = useSidebar();
  useEffect(() => {
    setOpen(hoverShowSidebar);
  }, [hoverShowSidebar, setOpen]);
  return null;
}

type AccountState =
  | { phase: 'unknown' }
  | { phase: 'signedOut' }
  | {
      phase: 'active';
      user: {
        uid: string;
        email: string | null;
        displayName: string | null;
        photoURL: string | null;
      };
    }
  | {
      phase: 'pending';
      user: {
        uid: string;
        email: string | null;
        displayName: string | null;
        photoURL: string | null;
      };
      scheduledAtMs: number;
    }
  | {
      phase: 'disabled';
      user: {
        uid: string;
        email: string | null;
        displayName: string | null;
        photoURL: string | null;
      };
    };

const ALL_PANELS = ['songs', 'library', 'settings'] as const;

const AppReadyNotifier = memo(function AppReadyNotifier({
  app,
  onReady,
}: {
  app: AppKey;
  onReady: (app: AppKey) => void;
}) {
  useEffect(() => {
    let active = true;
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (active) {
          onReady(app);
        }
      });
    });
    return () => {
      active = false;
      cancelAnimationFrame(rafId);
    };
  }, [app, onReady]);

  return null;
});

export default function App() {
  const activePanel = useNavigationStore((s) => {
    const last = s.history[s.history.length - 1];
    return last?.app === 'chords' && last.page ? (last.page as ActivePanel) : 'library';
  });
  const setActivePanel = (panel: ActivePanel) => {
    NavigationDispatcher.push({ app: 'chords', page: panel });
  };
  const { activePresetId } = useChordStore();
  const { settings, updateSettings } = useSettingsStore();
  const { preferences } = useStudioPreferences();

  const {
    state: transitionState,
    launchingApp,
    appPreloaded,
    requestTransition,
    setAppPreloaded,
  } = useApplicationTransitionStore();

  const routeApp = useNavigationStore((s) => s.history[s.history.length - 1]?.app ?? 'hub');

  const splashVisible = transitionState !== 'IDLE';
  const previousAppModeRef = useRef<AppKey>((routeApp as AppKey) || 'hub');

  // Global theme transition listener
  useEffect(() => {
    (window as any).__triggerThemeTransition = (
      nextTheme: string,
      amoled: boolean,
      x: number,
      y: number,
      updateFn: () => void
    ) => {
      ThemeTransitionEngine.startTransition({
        nextTheme,
        amoled,
        startX: x,
        startY: y,
        updateFn,
      });
    };

    return () => {
      delete (window as any).__triggerThemeTransition;
    };
  }, []);

  // Launch transition hook using global useApplicationTransitionStore state machine
  useEffect(() => {
    const appMode = (routeApp as AppKey) || 'hub';
    if (appMode !== previousAppModeRef.current) {
      const ok = requestTransition(appMode);
      if (ok) {
        previousAppModeRef.current = appMode;
        if (appMode === 'hub') {
          // Hub is root app and always preloaded
          setAppPreloaded(true);
        }
      }
    }
  }, [routeApp, requestTransition, setAppPreloaded]);

  const handleAppPreloaded = useCallback(
    (app: AppKey) => {
      if (useNavigationStore.getState().history[useNavigationStore.getState().history.length - 1]?.app !== app) return;
      setAppPreloaded(true);
    },
    [setAppPreloaded]
  );

  const returnToStudioHub = useCallback(
    (isSwipeSuccess = false) => {
      // 1. Close active modals/sheets/overlays
      window.dispatchEvent(new CustomEvent('studio:close-all-sheets'));
      window.dispatchEvent(new CustomEvent('studio:close-all-modals'));
      document.querySelectorAll('.modal-backdrop, .overlay').forEach((el) => {
        if (el.id !== 'update-fade-overlay') {
          el.remove();
        }
      });
      document.documentElement.classList.remove('has-modal-open');

      // 2. Set transition active lock
      (window as any).studioTransitionActive = true;

      // Reset Hub's zoom/opacity animation state immediately so it starts fading in as the sub-app exits
      window.dispatchEvent(new CustomEvent('studio:reset-hub-zooming'));

      // 3. Clear selected/active app state, reset animation locks & return to Hub after transition
      NavigationDispatcher.reset([{ app: 'hub', tab: 'home' }]);

      // Reset nested views to defaults if rememberLastAppSection is disabled
      if (!preferences.rememberLastAppSection) {
        const storeState = useSettingsStore.getState();
        storeState.setLastSession({
          vocalexTab: 'coach',
          drumexTab: storeState.settings.defaultDrumTab ?? 'songs',
          stagexView: storeState.settings.defaultStageView ?? 'Editor',
        });
      }

      setTimeout(() => {
        (window as any).studioTransitionActive = false;
      }, 280);
    },
    [updateSettings, preferences.rememberLastAppSection]
  );

  const returnToStudioHubRef = useRef(returnToStudioHub);
  useEffect(() => {
    returnToStudioHubRef.current = returnToStudioHub;
  }, [returnToStudioHub]);

  // Export to window object so external sub-apps can call it directly
  useEffect(() => {
    (window as any).returnToStudioHub = returnToStudioHub;
    return () => {
      delete (window as any).returnToStudioHub;
    };
  }, [returnToStudioHub]);

  // Backward compatibility listener for studio-hub-return CustomEvent
  useEffect(() => {
    const handler = () => {
      returnToStudioHubRef.current();
    };
    window.addEventListener('studio-hub-return', handler);
    return () => window.removeEventListener('studio-hub-return', handler);
  }, []);

  // Synchronize transitionActive with window.studioTransitionActive
  useEffect(() => {
    try {
      Object.defineProperty(window, 'studioTransitionActive', {
        get() {
          return useNavigationStore.getState().isTransitioning;
        },
        set(val) {
          useNavigationStore.getState().setTransition(null, !!val);
        },
        configurable: true,
      });
    } catch (e) {
    }
    return () => {
      try {
        delete (window as any).studioTransitionActive;
      } catch (e) {}
    };
  }, []);

  const [route, setRoute] = useState(() => {
    if (typeof window === 'undefined') return '/';
    const path = window.location.pathname;
    if (path === '/app' || path.startsWith('/app/')) return '/app';
    return '/';
  });

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setRoute(path);
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/app' || path.startsWith('/app/')) {
        setRoute('/app');
      } else {
        setRoute('/');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (route === '/') {
      document.documentElement.classList.add('landing-route');
      document.documentElement.classList.remove('app-route');
    } else {
      document.documentElement.classList.add('app-route');
      document.documentElement.classList.remove('landing-route');

      const intro = document.getElementById('intro');
      if (intro && (window as any).__introReturnedEarly) {
        intro.style.transition = 'opacity 500ms ease-out';
        intro.style.opacity = '0';
        setTimeout(() => {
          intro.classList.add('dismissed');
          if (intro.parentNode) intro.parentNode.removeChild(intro);
        }, 550);
        (window as any).__introDone = true;
        window.dispatchEvent(new Event('studio-intro-done'));
      }
    }
  }, [route]);

  const isWebDesktop = useIsWebDesktop();
  const [isLargeDesktop, setIsLargeDesktop] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth >= 1024;
  });

  useEffect(() => {
    if (!isWebDesktop) return;
    const handleResize = () => {
      setIsLargeDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isWebDesktop]);

  const [hoverShowSidebar, setHoverShowSidebar] = useState(false);
  const hoverTimerRef = useRef<number | null>(null);

  const handleSidebarMouseEnter = useCallback(() => {
    if (!isWebDesktop) return;
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setHoverShowSidebar(true);
  }, [isWebDesktop]);

  const handleSidebarMouseLeave = useCallback(() => {
    if (!isWebDesktop) return;
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    hoverTimerRef.current = window.setTimeout(() => {
      setHoverShowSidebar(false);
    }, 180);
  }, [isWebDesktop]);

  const handleLeftEdgeMouseEnter = useCallback(() => {
    if (!isWebDesktop) return;
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setHoverShowSidebar(true);
  }, [isWebDesktop]);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const shouldHideSidebar = isWebDesktop && !hoverShowSidebar;

  const [accountState, setAccountState] = useState<AccountState>({ phase: 'unknown' });
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    let active = true;
    const initAuth = async () => {
      try {
        const { supabase } = await import('@workspace/studio-core');
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        if (!active) return;
        setSession(currentSession);

        if (currentSession?.user) {
          const { userRepository } = await import('@workspace/studio-core');
          const doc = await userRepository.getAccountDoc(currentSession.user.id);
          if (!active) return;
          const status = doc || { status: 'active', scheduledAtMs: null };
          if (status.status === 'pending_deletion') {
            setAccountState({
              phase: 'pending',
              user: currentSession.user as any,
              scheduledAtMs: status.scheduledAtMs || Date.now(),
            });
          } else if (status.status === 'disabled') {
            setAccountState({ phase: 'disabled', user: currentSession.user as any });
          } else {
            setAccountState({ phase: 'active', user: currentSession.user as any });
          }
        } else {
          setAccountState({ phase: 'signedOut' });
        }
      } catch (err) {
        console.error('Failed to init auth:', err);
        if (active) setAccountState({ phase: 'signedOut' });
      }
    };

    initAuth();
    return () => {
      active = false;
    };
  }, []);

  const appMode = routeApp || 'hub';
  const isSubAppActive = appMode !== 'hub';

  const lastActiveAppRef = useRef<AppKey>('chords');
  if (isSubAppActive) {
    lastActiveAppRef.current = appMode as AppKey;
  }
  const stableKey = lastActiveAppRef.current;

  // Cache the active panel for the chords sub-app so it doesn't flash/change during exit transitions
  const [cachedPanel, setCachedPanel] = useState<ActivePanel>(activePanel);

  useEffect(() => {
    if (appMode === 'chords' && activePanel !== cachedPanel) {
      setCachedPanel(activePanel);
    }
  }, [activePanel, cachedPanel, appMode]);

  // Register diagnostics getters for printDiagnosticsDump
  useEffect(() => {
    navDiagnosticsRegistry.getMountedTree = () => {
      const tree: string[] = [];
      tree.push('StudioHub');
      if (appMode !== 'hub') tree.push(`SubAppWrapper(${appMode})`);
      return tree;
    };
    navDiagnosticsRegistry.getVisibleTree = () => {
      const tree: string[] = [];
      if (appMode === 'hub') tree.push('StudioHub');
      else tree.push(`SubAppWrapper(${appMode})`);
      return tree;
    };
    navDiagnosticsRegistry.getAnimationState = () => {
      return `appMode: ${appMode}`;
    };
    navDiagnosticsRegistry.getAppMode = () => appMode;
    navDiagnosticsRegistry.getCachedPanel = () => cachedPanel;
    return () => {
      delete navDiagnosticsRegistry.getMountedTree;
      delete navDiagnosticsRegistry.getVisibleTree;
      delete navDiagnosticsRegistry.getAnimationState;
      delete navDiagnosticsRegistry.getAppMode;
      delete navDiagnosticsRegistry.getCachedPanel;
    };
  }, [appMode, cachedPanel]);

  useEffect(() => {
    const timestamp = new Date().toISOString();
    if (isSubAppActive) {
      return () => {
        // Clean up modals, backdrops, sheets, and overlays when unmounting any sub-app
        window.dispatchEvent(new CustomEvent('studio:close-all-sheets'));
        window.dispatchEvent(new CustomEvent('studio:close-all-modals'));
        document.querySelectorAll('.modal-backdrop, .overlay').forEach((el) => {
          if (el.id !== 'update-fade-overlay') {
            el.remove();
          }
        });
        document.documentElement.classList.remove('has-modal-open');
      };
    }
    return () => {};
  }, [appMode, isSubAppActive, stableKey]);

  if (route === '/') {
    return <StudioLandingPage navigateTo={navigateTo} />;
  }

  return (
    <SidebarProvider>
      <SidebarHoverSync hoverShowSidebar={hoverShowSidebar} />
      <div
        style={{
          display: 'flex',
          width: '100vw',
          height: '100dvh',
          overflow: 'hidden',
          background: 'var(--app-bg)',
        }}
      >
        {isWebDesktop && (
          <div
            onMouseEnter={handleSidebarMouseEnter}
            onMouseLeave={handleSidebarMouseLeave}
            style={{ display: 'flex', height: '100%' }}
          >
            <WebSidebarLayout shouldHideSidebar={shouldHideSidebar} />
          </div>
        )}

        <SidebarInset>
          {isWebDesktop && !hoverShowSidebar && (
            <div
              onMouseEnter={handleLeftEdgeMouseEnter}
              onMouseLeave={handleSidebarMouseLeave}
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                width: '12px',
                zIndex: 9999,
                background: 'transparent',
              }}
            />
          )}

          <div
            className="app-main-layout"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              height: '100dvh',
              overflow: 'hidden',
              pointerEvents: isSubAppActive ? 'none' : 'auto',
            }}
          >
            <StudioHub />
          </div>

          <AnimatePresence mode="wait">
            {isSubAppActive && (
              <motion.div
                key={stableKey}
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 2,
                  background: 'var(--app-bg)',
                  pointerEvents: isSubAppActive && !splashVisible ? 'auto' : 'none',
                }}
              >
                {stableKey === 'groovex' && appMode === 'groovex' && (
                  <div
                    className="app-sub-app-container"
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      overflow: 'hidden',
                    }}
                  >
                    <ErrorBoundary moduleName="Groovex">
                      <Suspense
                        fallback={<SmartLoading fallbackSkeleton={<GroovexAppSkeleton />} />}
                      >
                        <AppReadyNotifier app="groovex" onReady={handleAppPreloaded} />
                        <AppEntryTransition>
                          <GroovexApp />
                        </AppEntryTransition>
                      </Suspense>
                    </ErrorBoundary>
                  </div>
                )}

                {stableKey === 'vocalex' && appMode === 'vocalex' && (
                  <div
                    className="app-sub-app-container"
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      overflow: 'hidden',
                    }}
                  >
                    <ErrorBoundary moduleName="Vocalex">
                      <Suspense
                        fallback={<SmartLoading fallbackSkeleton={<VocalexTakesSkeleton />} />}
                      >
                        <AppReadyNotifier app="vocalex" onReady={handleAppPreloaded} />
                        <AppEntryTransition>
                          <VocalexApp />
                        </AppEntryTransition>
                      </Suspense>
                    </ErrorBoundary>
                  </div>
                )}

                {stableKey === 'stage' && appMode === 'stage' && (
                  <div
                    className="app-sub-app-container"
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      overflow: 'hidden',
                    }}
                  >
                    <ErrorBoundary moduleName="Stagex">
                      <Suspense
                        fallback={<SmartLoading fallbackSkeleton={<StagexPanelSkeleton />} />}
                      >
                        <AppReadyNotifier app="stage" onReady={handleAppPreloaded} />
                        <AppEntryTransition>
                          <StageCorePanel />
                        </AppEntryTransition>
                      </Suspense>
                    </ErrorBoundary>
                  </div>
                )}

                {stableKey === 'drums' && appMode === 'drums' && (
                  <div
                    className="app-sub-app-container"
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      overflow: 'hidden',
                    }}
                  >
                    <ErrorBoundary moduleName="Drumex">
                      <Suspense
                        fallback={<SmartLoading fallbackSkeleton={<DrumEditorSkeleton />} />}
                      >
                        <AppReadyNotifier app="drums" onReady={handleAppPreloaded} />
                        <AppEntryTransition>
                          <DrumEditor />
                        </AppEntryTransition>
                      </Suspense>
                    </ErrorBoundary>
                  </div>
                )}

                {stableKey === 'chords' && appMode === 'chords' && (
                  <div
                    className="app-sub-app-container"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      width: '100%',
                      height: '100%',
                      overflow: 'hidden',
                      userSelect: 'none',
                      background: 'var(--app-bg)',
                    }}
                  >
                    <ScreenScaffold
                      safeAreaTop={!isWebDesktop}
                      safeAreaBottom={false}
                      className="app-bg"
                    >
                      <AppReadyNotifier app="chords" onReady={handleAppPreloaded} />
                      <AppEntryTransition
                        className="flex flex-col w-full overflow-hidden select-none"
                        style={
                          {
                            position: 'relative',
                            height: '100%',
                          } as React.CSSProperties
                        }
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: isWebDesktop && isLargeDesktop ? 'row' : 'column',
                            flex: 1,
                            width: '100%',
                            height: '100%',
                            overflow: 'hidden',
                          }}
                        >
                          {isWebDesktop && (
                            <WebAppSectionDock
                              app="chords"
                              activeSection={cachedPanel}
                              onChangeSection={setActivePanel}
                            />
                          )}
                          <div
                            className="flex-1 overflow-hidden relative"
                            style={{ contain: 'strict' }}
                          >
                            <ErrorBoundary moduleName="Chordex">
                              <Suspense
                                fallback={
                                  <SmartLoading fallbackSkeleton={<ChordexPanelSkeleton />} />
                                }
                              >
                                <SharedNavigationContainer
                                  activeView={cachedPanel}
                                  viewOrder={ALL_PANELS}
                                >
                                  {(panel) => (
                                    <>
                                      {panel === 'songs' && <SongsPanel />}
                                      {panel === 'library' && <LibraryPanel />}
                                      {panel === 'settings' && <SettingsPanel />}
                                    </>
                                  )}
                                </SharedNavigationContainer>
                              </Suspense>
                            </ErrorBoundary>
                          </div>
                        </div>
                      </AppEntryTransition>
                    </ScreenScaffold>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </SidebarInset>
      </div>

      <AnimatePresence>
        {launchingApp && (
          <ApplicationTransitionEngine
            appKey={launchingApp}
            preloaded={appPreloaded}
            onComplete={() => {}}
            isLight={
              settings.theme === 'light' ||
              (settings.theme === 'system' &&
                typeof window !== 'undefined' &&
                window.matchMedia('(prefers-color-scheme: light)').matches)
            }
            isAmoled={settings.perApp?.[launchingApp]?.amoledMode}
          />
        )}
      </AnimatePresence>
    </SidebarProvider>
  );
}
