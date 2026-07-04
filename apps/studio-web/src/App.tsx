import { type AppKey } from '@workspace/studio-core';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  useChordStore,
  ACCENT_COLORS,
  useIsWebDesktop,
  useStudioPreferences,
  logActivity,
  resetNav,
  setNavHidden,
  setNavLocked,
  NavigationDispatcher,
  useNavigationStore,
  type ActivePanel,
  navDiagnosticsRegistry
} from '@workspace/studio-core';

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
  LibraryPanel,
  ChordPanel,
  SettingsPanel,
  SongsPanel,
  DrumEditor,
  GroovexApp,
  VocalexApp,
  StageCorePanel,
  ErrorBoundary
} from '@workspace/ui-shared';

import {
  WebSidebarLayout,
  SidebarProvider,
  SidebarInset,
  useSidebar,
  WebAppSectionDock,
  StudioLandingPage
} from '@workspace/ui-web';

import "./index.css";

const StudioHub = lazy(() => import('@workspace/ui-shared').then(m => ({ default: m.StudioHub })));

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
  | { phase: 'active'; user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null } }
  | { phase: 'pending'; user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null }; scheduledAtMs: number }
  | { phase: 'disabled'; user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null } };

const NAV_ORDER = ['songs', 'library', 'chord', 'settings'] as const;
const ALL_PANELS = ['library', 'chord', 'songs', 'settings'] as const;

export default function App() {
  const currentRoute = useNavigationStore(s => s.history[s.history.length - 1]) || { app: 'hub' };
  const activePanel = (currentRoute.app === 'chords' && currentRoute.page ? currentRoute.page as ActivePanel : 'library');
  const setActivePanel = (panel: ActivePanel) => {
    NavigationDispatcher.push({ app: 'chords', page: panel });
  };
  const { settings, activePresetId, updateSettings } = useChordStore();
  const { preferences } = useStudioPreferences();

  // Synchronize appMode from navigation store route to chord store settings
  useEffect(() => {
    if (currentRoute.app && currentRoute.app !== settings.appMode) {
      updateSettings({ appMode: currentRoute.app });
    }
  }, [currentRoute.app, settings.appMode, updateSettings]);

  const returnToStudioHub = useCallback((isSwipeSuccess = false) => {
    // 1. Close active modals/sheets/overlays
    window.dispatchEvent(new CustomEvent('studio:close-all-sheets'));
    window.dispatchEvent(new CustomEvent('studio:close-all-modals'));
    document.querySelectorAll('.modal-backdrop, .overlay').forEach(el => {
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
    updateSettings({ appMode: 'hub' });
    NavigationDispatcher.reset([{ app: 'hub', tab: 'home' }]);
    
    // Reset nested views to defaults if rememberLastAppSection is disabled
    if (!preferences.rememberLastAppSection) {
      const storeState = useChordStore.getState();
      storeState.setLastSession({
        vocalexTab: 'practice',
        drumexTab: storeState.settings.defaultDrumTab ?? 'songs',
        stagexView: storeState.settings.defaultStageView ?? 'Editor',
      });
    }

    setTimeout(() => {
      (window as any).studioTransitionActive = false;
    }, 280);
  }, [updateSettings, preferences.rememberLastAppSection]);

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
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!active) return;
        setSession(currentSession);
        
        if (currentSession?.user) {
          const { getAccountDoc } = await import('@workspace/studio-core');
          const doc = await getAccountDoc(currentSession.user.id);
          if (!active) return;
          const status = doc || { status: 'active', scheduledAtMs: null };
          if (status.status === 'pending_deletion') {
            setAccountState({
              phase: 'pending',
              user: currentSession.user as any,
              scheduledAtMs: status.scheduledAtMs || Date.now()
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
    return () => { active = false; };
  }, []);

  const appMode = settings.appMode || 'hub';
  const isSubAppActive = appMode !== 'hub';

  const lastActiveAppRef = useRef<AppKey>('chords');
  if (isSubAppActive) {
    lastActiveAppRef.current = appMode as AppKey;
  }
  const stableKey = lastActiveAppRef.current;

  // Cache the active panel for the chords sub-app so it doesn't flash/change during exit transitions
  const [cachedPanel, setCachedPanel] = useState<ActivePanel>(activePanel);
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
    console.log(`[SubApp] [${timestamp}] State Update | appMode: ${appMode}, isSubAppActive: ${isSubAppActive}, stableKey: ${stableKey}`);
    if (isSubAppActive) {
      console.log(`[SubApp] [${timestamp}] Mount | app: ${stableKey}, activePanel: ${activePanel}`);
      return () => {
        console.log(`[SubApp] [${new Date().toISOString()}] Unmount | app: ${stableKey}`);
      };
    }
    return () => {};
  }, [appMode, isSubAppActive, stableKey]);

  useEffect(() => {
    if (appMode === 'chords') {
      console.log(`[SubApp] [${new Date().toISOString()}] setCachedPanel | prev: ${cachedPanel} -> next: ${activePanel}`);
      setCachedPanel(activePanel);
    }
  }, [activePanel, appMode]);

  if (route === '/') {
    return <StudioLandingPage navigateTo={navigateTo} />;
  }

  return (
    <SidebarProvider>
      <SidebarHoverSync hoverShowSidebar={hoverShowSidebar} />
      <div style={{ display: 'flex', width: '100vw', height: '100dvh', overflow: 'hidden', background: 'var(--app-bg)' }}>
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
            <Suspense fallback={<SmartLoading fallbackSkeleton={<StudioHubSkeleton />} />}>
              <StudioHub />
            </Suspense>
          </div>

          <AnimatePresence mode="popLayout">
            {isSubAppActive && (
              <motion.div
                key={stableKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 2,
                  background: 'var(--app-bg)',
                  pointerEvents: isSubAppActive ? 'auto' : 'none',
                }}
              >
                {stableKey === 'groovex' && (
                  <div className="app-sub-app-container" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                    <ErrorBoundary moduleName="Groovex">
                      <Suspense fallback={<SmartLoading fallbackSkeleton={<GroovexAppSkeleton />} />}><AppEntryTransition><GroovexApp /></AppEntryTransition></Suspense>
                    </ErrorBoundary>
                  </div>
                )}

                {stableKey === 'vocalex' && (
                  <div className="app-sub-app-container" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                    <ErrorBoundary moduleName="Vocalex">
                      <Suspense fallback={<SmartLoading fallbackSkeleton={<VocalexTakesSkeleton />} />}><AppEntryTransition><VocalexApp /></AppEntryTransition></Suspense>
                    </ErrorBoundary>
                  </div>
                )}

                {stableKey === 'stage' && (
                  <div className="app-sub-app-container" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                    <ErrorBoundary moduleName="Stagex">
                      <Suspense fallback={<SmartLoading fallbackSkeleton={<StagexPanelSkeleton />} />}><AppEntryTransition><StageCorePanel /></AppEntryTransition></Suspense>
                    </ErrorBoundary>
                  </div>
                )}

                {stableKey === 'drums' && (
                  <div className="app-sub-app-container" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                    <ErrorBoundary moduleName="Drumex"><Suspense fallback={<SmartLoading fallbackSkeleton={<DrumEditorSkeleton />} />}><AppEntryTransition><DrumEditor /></AppEntryTransition></Suspense></ErrorBoundary>
                  </div>
                )}

                {stableKey === 'chords' && (
                  <div className="app-sub-app-container" style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden', userSelect: 'none', background: 'var(--app-bg)' }}>
                    <AppEntryTransition
                      className="flex flex-col w-full overflow-hidden select-none app-bg"
                      style={{
                        position: 'relative',
                        height: '100%',
                      } as React.CSSProperties}
                    >
                      <div 
                        style={{ 
                          display: 'flex', 
                          flexDirection: (isWebDesktop && isLargeDesktop) ? 'row' : 'column', 
                          flex: 1, 
                          width: '100%', 
                          height: '100%', 
                          overflow: 'hidden' 
                        }}
                      >
                        {isWebDesktop && (
                          <WebAppSectionDock 
                            app="chords" 
                            activeSection={cachedPanel} 
                            onChangeSection={setActivePanel} 
                          />
                        )}
                        <div className="flex-1 overflow-hidden relative" style={{ contain: 'strict' }}>
                          {ALL_PANELS.map(panel => {
                            const isVisible = cachedPanel === panel;
                            if (!isVisible) return null;

                            return (
                              <div
                                key={panel}
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  pointerEvents: 'auto',
                                }}
                              >
                                <ErrorBoundary moduleName="Chordex">
                                  <Suspense fallback={<SmartLoading fallbackSkeleton={<ChordexPanelSkeleton />} />}>
                                    {panel === 'library'  && <LibraryPanel />}
                                    {panel === 'chord'    && <ChordPanel />}
                                    {panel === 'songs'    && <SongsPanel />}
                                    {panel === 'settings' && <SettingsPanel />}
                                  </Suspense>
                                </ErrorBoundary>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </AppEntryTransition>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
