import { activeOverlaysRegistry } from '../design-system/dialogs';
import { lazy, Suspense, useCallback, useEffect, useRef, useState, memo } from 'react';
import { createPortal } from 'react-dom';
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
  BackDispatcher,
  useStatusBar,
  recordNavigation,
  getNavigationEntries,
  NATIVE_VERSION,
  tolgee,
  addLog,
  useBackHandler,
  StartupCoordinator,
  useNavigationStore,
  NavigationDispatcher,
  type ActivePanel,
  navDiagnosticsRegistry,
  useApplicationTransitionStore,
  ThemeTransitionEngine,
  useBottomNavigationStore,
  subscribeSyncStatus,
  syncNow,
  useSettingsStore,
  authRepository,
  EasingPresets,
  type AppKey,
  useDeveloperInspectorStore,
} from '@workspace/studio-core';

import { StudioHubSkeleton } from '../loading/StudioSkeleton';
import { ErrorBoundary } from '../feedback/ErrorBoundary';
import { AppEntryTransition, useAnimationSpeed } from '../../features/hub/animations/AppAnimationSystem';
import { SubAppScaffold, ScreenScaffold } from './StudioLayoutSystem';
import { SharedNavigationContainer } from '../../navigation/SharedNavigationContainer';
import { ApplicationTransitionEngine } from '../../features/hub/animations/ApplicationTransitionEngine';

const ALL_PANELS = ['songs', 'library', 'preferences'] as const;

export interface SharedAppShellProps {
  isAndroid?: boolean;
  isWeb?: boolean;
  wrapProviders?: (children: React.ReactNode) => React.ReactNode;
  renderSidebar?: () => React.ReactNode;
  renderBottomNav?: () => React.ReactNode;
  renderLaunchOverlay?: () => React.ReactNode;
  renderEmergencyOverlay?: () => React.ReactNode;
  
  hubElement: React.ReactNode;
  subApps: {
    groovex: React.ReactNode;
    vocalex: React.ReactNode;
    stage: React.ReactNode;
    drums: React.ReactNode;
    chords: {
      sidebar?: React.ReactNode;
      songs: React.ReactNode;
      practice: React.ReactNode;
      library: React.ReactNode;
      preferences: React.ReactNode;
    };
  };
}


/* ── INSPECTOR ROUTE TRACER DEBUG TOOL ────────────────────────────────── */
function InspectorRouteTracer() {
  const isDev = typeof process !== 'undefined' ? process.env.NODE_ENV !== 'production' : true;
  if (!isDev) return null;

  const history = useNavigationStore((s) => s.history);
  const settings = useSettingsStore((state) => state.settings);
  const isSwitcherOpen = useBottomNavigationStore((s) => s.isSwitcherOpen);
  const isProfileMenuOpen = useBottomNavigationStore((s) => s.isProfileMenuOpen);
  const isSearchOpen = useBottomNavigationStore((s) => s.isSearchOpen);

  const [activeModalsCount, setActiveModalsCount] = useState(0);
  const [activeSheetsCount, setActiveSheetsCount] = useState(0);
  const [minimized, setMinimized] = useState(true);

  useEffect(() => {
    return activeOverlaysRegistry.subscribe(() => {
      setActiveModalsCount(activeOverlaysRegistry.modals.size);
      setActiveSheetsCount(activeOverlaysRegistry.sheets.size);
    });
  }, []);

  const currentRoute = history[history.length - 1] || { app: 'hub' };

  const appMap: Record<string, string> = {
    hub: 'Hub',
    chords: 'Chordex',
    drums: 'Drumex',
    stage: 'Stagex',
    groovex: 'Groovex',
    vocalex: 'Vocalex',
  };

  const currentApp = appMap[currentRoute.app] || currentRoute.app;
  
  let currentModule = 'Livex Hub';
  if (currentRoute.app === 'hub') {
    if (currentRoute.tab === 'settings') currentModule = 'Livex Settings';
    else if (currentRoute.tab === 'profile') currentModule = 'User Profile';
    else if (currentRoute.tab === 'help') currentModule = 'FAQ & Support';
  } else {
    currentModule = currentApp;
  }

  let currentScreen = 'Home';
  if (currentRoute.page) {
    currentScreen = currentRoute.page.charAt(0).toUpperCase() + currentRoute.page.slice(1);
  } else if (currentRoute.tab) {
    currentScreen = currentRoute.tab.charAt(0).toUpperCase() + currentRoute.tab.slice(1);
  }

  let currentPath = `/${currentRoute.app}`;
  if (currentRoute.tab) currentPath += `/${currentRoute.tab}`;
  if (currentRoute.page) currentPath += `/${currentRoute.page}`;

  let currentNested = '';
  if (currentRoute.subView) currentNested += `/${currentRoute.subView}`;
  if (currentRoute.id) currentNested += `/${currentRoute.id}`;
  if (!currentNested) currentNested = 'None';

  const stackString = history.map((r) => {
    let s = r.app;
    if (r.page) s += '/' + r.page;
    return s;
  }).join(' -> ');

  let layoutComp = 'HubScaffold';
  if (currentRoute.page && currentRoute.page !== 'main') {
    layoutComp = 'SettingsLayout';
  } else if (currentRoute.app !== 'hub') {
    layoutComp = 'SubAppScaffold';
  }

  let headerComp = 'HubHeader';
  if (currentRoute.page && currentRoute.page !== 'main') {
    headerComp = 'SharedFloatingHeader';
  } else if (currentRoute.app !== 'hub') {
    headerComp = 'SubAppHeader';
  }

  const bottomNavComp = useBottomNavigationStore.getState().visible ? 'SharedBottomNavigation' : 'None';
  const currentModal = activeModalsCount > 0 ? 'Dialog' : 'None';
  const currentSheet = activeSheetsCount > 0 ? 'Sheet' : 'None';
  const currentOverlay = isSwitcherOpen ? 'AppSwitcher' : isProfileMenuOpen ? 'ProfileMenu' : isSearchOpen ? 'Search' : 'None';

  const densityMode = settings.displayDensity 
    ? settings.displayDensity.charAt(0).toUpperCase() + settings.displayDensity.slice(1) 
    : 'Standard';
  
  const currentTheme = settings.theme 
    ? settings.theme.charAt(0).toUpperCase() + settings.theme.slice(1) 
    : 'Dark';

  const appearanceMode = settings.amoledMode ? 'AMOLED' : (settings.theme === 'light' ? 'Light' : 'Dark');

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '16px',
          zIndex: 999999,
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.85)',
          border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#10b981',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>route</span>
      </button>
    );
  }

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: 4,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 9,
    textTransform: 'uppercase',
    color: '#8e8e93',
    fontWeight: 700,
    letterSpacing: '0.05em',
  };

  const valStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 600,
    fontFamily: 'monospace',
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '16px',
        zIndex: 999999,
        width: '240px',
        maxHeight: '400px',
        overflowY: 'auto',
        background: 'rgba(0,0,0,0.92)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '12px',
        padding: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        color: '#ffffff',
        fontFamily: 'Inter, sans-serif',
      }}
      className="no-scrollbar"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#10b981' }}>route</span>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#10b981' }}>Route Tracer</span>
        </div>
        <button
          onClick={() => setMinimized(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#8e8e93',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={itemStyle}>
          <span style={labelStyle}>Current App</span>
          <span style={valStyle}>{currentApp}</span>
        </div>
        <div style={itemStyle}>
          <span style={labelStyle}>Module</span>
          <span style={valStyle}>{currentModule}</span>
        </div>
        <div style={itemStyle}>
          <span style={labelStyle}>Screen</span>
          <span style={valStyle}>{currentScreen}</span>
        </div>
        <div style={itemStyle}>
          <span style={labelStyle}>Route</span>
          <span style={valStyle}>{currentPath}</span>
        </div>
        <div style={itemStyle}>
          <span style={labelStyle}>Nested Route</span>
          <span style={valStyle}>{currentNested}</span>
        </div>
        <div style={itemStyle}>
          <span style={labelStyle}>Stack</span>
          <span style={{ ...valStyle, fontSize: 10, wordBreak: 'break-all' }}>{stackString}</span>
        </div>
        <div style={itemStyle}>
          <span style={labelStyle}>Layout</span>
          <span style={valStyle}>{layoutComp}</span>
        </div>
        <div style={itemStyle}>
          <span style={labelStyle}>Shared Layout</span>
          <span style={valStyle}>ScreenScaffold</span>
        </div>
        <div style={itemStyle}>
          <span style={labelStyle}>Header</span>
          <span style={valStyle}>{headerComp}</span>
        </div>
        <div style={itemStyle}>
          <span style={labelStyle}>Bottom Navigation</span>
          <span style={valStyle}>{bottomNavComp}</span>
        </div>
        <div style={itemStyle}>
          <span style={labelStyle}>Modal</span>
          <span style={valStyle}>{currentModal}</span>
        </div>
        <div style={itemStyle}>
          <span style={labelStyle}>Sheet</span>
          <span style={valStyle}>{currentSheet}</span>
        </div>
        <div style={itemStyle}>
          <span style={labelStyle}>Overlay</span>
          <span style={valStyle}>{currentOverlay}</span>
        </div>
        <div style={itemStyle}>
          <span style={labelStyle}>Density</span>
          <span style={valStyle}>{densityMode}</span>
        </div>
        <div style={itemStyle}>
          <span style={labelStyle}>Theme</span>
          <span style={valStyle}>{currentTheme}</span>
        </div>
        <div style={itemStyle}>
          <span style={labelStyle}>Appearance Mode</span>
          <span style={valStyle}>{appearanceMode}</span>
        </div>
      </div>
    </div>
  );
}

export function SharedAppShell({
  isAndroid,
  isWeb,
  wrapProviders,
  renderSidebar,
  renderBottomNav,
  renderLaunchOverlay,
  renderEmergencyOverlay,
  hubElement,
  subApps,
}: SharedAppShellProps) {
  const activePanel = useNavigationStore((s) => {
    const last = s.history[s.history.length - 1];
    if (last?.app === 'chords' && last.page === 'chord') {
      return 'library';
    }
    return last?.app === 'chords' && last.page ? (last.page as ActivePanel) : 'library';
  });
  const routeApp = useNavigationStore((s) => s.history[s.history.length - 1]?.app ?? 'hub');
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const isInspectorEnabled = useDeveloperInspectorStore((s) => s.isEnabled);
  const showRouteTracer = useDeveloperInspectorStore((s) => s.showRouteTracer);
  const speedScale = useAnimationSpeed();
  
  const [hubRenderKey, setHubRenderKey] = useState(0);
  const [showHub, setShowHub] = useState(true);
  useEffect(() => {
    BackDispatcher.initialize();

    const unsub = StartupCoordinator.subscribe((phases) => {
      // Monitor startup progress if needed
    });

    void StartupCoordinator.run(() => {
      console.log('[StartupCoordinator] App bootstrap complete via SharedAppShell.');
    });

    return () => {
      unsub();
      StartupCoordinator.cancel('app_unmounted');
    };
  }, []);

  // Bi-directional synchronization between navigation stack and settings
  const lastSyncedRouteAppRef = useRef<string | null>(null);
  const lastSyncedSettingsAppRef = useRef<string | null>(null);

  useEffect(() => {
    const settingsApp = settings.appMode || 'hub';
    if (routeApp !== settingsApp) {
      const routeChanged = lastSyncedRouteAppRef.current !== null && routeApp !== lastSyncedRouteAppRef.current;
      const settingsChanged = lastSyncedSettingsAppRef.current !== null && settingsApp !== lastSyncedSettingsAppRef.current;

      if (routeChanged && !settingsChanged) {
        updateSettings({ appMode: routeApp as any });
      } else if (settingsChanged && !routeChanged) {
        if (settingsApp === 'hub') {
          NavigationDispatcher.reset([{ app: 'hub', tab: 'home' }]);
        } else {
          const currentHistory = useNavigationStore.getState().history;
          const isCurrentlySubApp = currentHistory.length > 1 && currentHistory[currentHistory.length - 1].app !== 'hub';
          if (isCurrentlySubApp) {
            NavigationDispatcher.replace({ app: settingsApp as any });
          } else {
            NavigationDispatcher.push({ app: settingsApp as any });
          }
        }
      } else {
        updateSettings({ appMode: routeApp as any });
      }
    }

    lastSyncedRouteAppRef.current = routeApp;
    lastSyncedSettingsAppRef.current = settingsApp;
  }, [routeApp, settings.appMode, updateSettings]);

  useEffect(() => {
    document.documentElement.style.setProperty('--motion-speed-scale', String(speedScale));
  }, [speedScale]);

  // Launch transition state machine
  const {
    state: transitionState,
    launchingApp,
    appPreloaded,
    requestTransition,
    setAppPreloaded,
  } = useApplicationTransitionStore();

  const splashVisible = transitionState !== 'IDLE';
  const transitionPreviousAppModeRef = useRef<AppKey | 'hub'>(settings.appMode || 'hub');
  const transitionActive = useNavigationStore((s) => s.isTransitioning);

  useEffect(() => {
    const appMode = settings.appMode || 'hub';
    if (appMode !== transitionPreviousAppModeRef.current) {
      const ok = requestTransition(appMode);
      if (ok) {
        transitionPreviousAppModeRef.current = appMode;
        if (appMode === 'hub') {
          setAppPreloaded(true);
        }
      }
    }
  }, [settings.appMode, requestTransition, setAppPreloaded]);

  const handleAppPreloaded = useCallback(
    (app: AppKey) => {
      if (useSettingsStore.getState().settings.appMode !== app) return;
      setAppPreloaded(true);
    },
    [setAppPreloaded]
  );

  const appMode = settings.appMode || 'hub';
  const isSubAppActive = appMode !== 'hub' || launchingApp !== null;
  const stableKey = launchingApp || appMode;

  // Forensics watchdogs (kept globally so Web benefits from resilient recovering)
  useEffect(() => {
    (window as any).__runRootWatchdogCheck = (name: string) => {
      const currentMode = useSettingsStore.getState().settings.appMode || 'hub';
      const rootNode = document.getElementById('root');
      const appContainer = document.querySelector('.app-container');
      if (currentMode === 'hub' && rootNode && !appContainer) {
        if (typeof (window as any).__forceRerenderApp === 'function') {
          (window as any).__forceRerenderApp();
        }
        // @ts-ignore - injected global watchdog variable
        window.studioTransitionActive = false;
        useSettingsStore.getState().updateSettings({ appMode: 'hub' });
      }
    };
    return () => {
      delete (window as any).__runRootWatchdogCheck;
    };
  }, []);

  // Theme transitions
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

  // Transition active syncing
  useEffect(() => {
    try {
      Object.defineProperty(window, 'studioTransitionActive', {
        get() { return useNavigationStore.getState().isTransitioning; },
        set(val) { useNavigationStore.getState().setTransition(null, !!val); },
        configurable: true,
      });
    } catch (e) {}
  }, []);

  // Watchdog
  useEffect(() => {
    let watchdogTimer: ReturnType<typeof setTimeout>;
    if (transitionActive) {
      watchdogTimer = setTimeout(() => {
        useNavigationStore.getState().setTransition(null, false);
        updateSettings({ appMode: 'hub' });
        window.dispatchEvent(new CustomEvent('studio:reset-hub-zooming'));
      }, 6000);
    }
    return () => clearTimeout(watchdogTimer);
  }, [transitionActive, updateSettings]);

  const content = (
    <div
      className={`app-container app-mode-${appMode}`}
      style={{
        display: 'flex',
        width: '100vw',
        height: '100dvh',
        overflow: 'hidden',
        background: 'var(--app-bg)',
        opacity: 1,
        pointerEvents: 'auto',
      }}
    >
      <ErrorBoundary moduleName="RootApp">
        <Suspense fallback={null}>
          <div
            className="app-main-layout"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              height: '100dvh',
              overflow: 'hidden',
              pointerEvents: isSubAppActive ? 'none' : 'auto',
              opacity: isSubAppActive && !transitionActive ? 0 : 1,
              visibility: isSubAppActive && !transitionActive ? 'hidden' : 'visible',
              transition: 'opacity 350ms cubic-bezier(0.16, 1, 0.3, 1), visibility 350ms',
            }}
          >
            {renderSidebar?.()}
            {showHub && (
              <Suspense fallback={<StudioHubSkeleton />}>
                <div key={hubRenderKey} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {hubElement}
                </div>
              </Suspense>
            )}
          </div>

          <AnimatePresence mode="wait">
            {isSubAppActive && stableKey !== 'hub' && (
              <motion.div
                key={stableKey}
                className="sc-subapp-wrapper"
                initial={{ opacity: 1, scale: 1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98, pointerEvents: 'none' as any }}
                transition={{ duration: 0.3 * speedScale, ease: EasingPresets.standard }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 2,
                  background: 'var(--app-bg)',
                  pointerEvents: isSubAppActive && !splashVisible ? 'auto' : 'none',
                }}
              >
                <SubAppWrapper
                  app={stableKey as AppKey}
                  activePanel={activePanel}
                  settings={settings}
                  onReady={handleAppPreloaded}
                  subApps={subApps}
                />
              </motion.div>
            )}
          </AnimatePresence>

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
          {renderBottomNav?.()}
        </Suspense>
      </ErrorBoundary>
      {renderLaunchOverlay?.()}
      {renderEmergencyOverlay?.()}
      {settings.developerMode && isInspectorEnabled && showRouteTracer && <InspectorRouteTracer />}
    </div>
  );

  return wrapProviders ? <>{wrapProviders(content)}</> : content;
}

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
        if (active) onReady(app);
      });
    });
    return () => {
      active = false;
      cancelAnimationFrame(rafId);
    };
  }, [app, onReady]);
  return null;
});

function FallbackTracker({ app, children }: { app: AppKey; children: React.ReactNode }) {
  useEffect(() => {
    recordNavigation({
      fromApp: 'hub',
      toApp: app,
      activeAppAfterTransition: app,
      transitionLockState: (window as any).studioTransitionActive || false,
      fallbackRendered: true,
    });
  }, [app]);
  return <>{children}</>;
}

const SubAppWrapper = memo(function SubAppWrapper({
  app,
  activePanel,
  settings,
  onReady,
  subApps,
}: {
  app: AppKey;
  activePanel: string;
  settings: any;
  onReady: (app: AppKey) => void;
  subApps: SharedAppShellProps['subApps'];
}) {
  const [cachedApp] = useState<AppKey>(app);
  const [cachedPanel, setCachedPanel] = useState(activePanel);

  useEffect(() => {
    setCachedPanel(activePanel);
  }, [activePanel]);

  const isActive = settings.appMode === cachedApp;

  if (!isActive) return null;

  return (
    <>
      {cachedApp === 'groovex' && subApps.groovex && (
        <SubAppScaffold appKey="groovex">
          <ErrorBoundary moduleName="Groovex">
            <Suspense fallback={<FallbackTracker app="groovex"><div style={{ width: '100%', height: '100%', background: 'var(--app-bg)' }} /></FallbackTracker>}>
              <AppReadyNotifier app="groovex" onReady={onReady} />
              <AppEntryTransition>
                {subApps.groovex}
              </AppEntryTransition>
            </Suspense>
          </ErrorBoundary>
        </SubAppScaffold>
      )}

      {cachedApp === 'vocalex' && subApps.vocalex && (
        <SubAppScaffold appKey="vocalex">
          <ErrorBoundary moduleName="Vocalex">
            <Suspense fallback={<FallbackTracker app="vocalex"><div style={{ width: '100%', height: '100%', background: 'var(--app-bg)' }} /></FallbackTracker>}>
              <AppReadyNotifier app="vocalex" onReady={onReady} />
              <AppEntryTransition>
                {subApps.vocalex}
              </AppEntryTransition>
            </Suspense>
          </ErrorBoundary>
        </SubAppScaffold>
      )}

      {cachedApp === 'stage' && subApps.stage && (
        <SubAppScaffold appKey="stage">
          <ErrorBoundary moduleName="Stagex">
            <Suspense fallback={<FallbackTracker app="stage"><div style={{ width: '100%', height: '100%', background: 'var(--app-bg)' }} /></FallbackTracker>}>
              <AppReadyNotifier app="stage" onReady={onReady} />
              <AppEntryTransition>
                {subApps.stage}
              </AppEntryTransition>
            </Suspense>
          </ErrorBoundary>
        </SubAppScaffold>
      )}

      {cachedApp === 'drums' && subApps.drums && (
        <SubAppScaffold appKey="drums">
          <ErrorBoundary moduleName="Drumex">
            <Suspense fallback={<FallbackTracker app="drums"><div style={{ width: '100%', height: '100%', background: 'var(--app-bg)' }} /></FallbackTracker>}>
              <AppReadyNotifier app="drums" onReady={onReady} />
              <AppEntryTransition>
                {subApps.drums}
              </AppEntryTransition>
            </Suspense>
          </ErrorBoundary>
        </SubAppScaffold>
      )}

      {cachedApp === 'chords' && subApps.chords && (
        <SubAppScaffold appKey="chords">
          <ScreenScaffold safeAreaTop={true} safeAreaBottom={false} className="app-bg">
            <AppEntryTransition className="flex flex-col w-full overflow-hidden select-none" style={{ position: 'relative', height: '100%' } as any}>
              <div style={{ display: 'flex', flexDirection: subApps.chords.sidebar ? 'row' : 'column', flex: 1, width: '100%', height: '100%', overflow: 'hidden' }}>
                {subApps.chords.sidebar}
                <div className="flex-1 overflow-hidden relative" style={{ contain: 'strict' }}>
                  <ErrorBoundary moduleName="Chordex">
                    <Suspense fallback={<FallbackTracker app="chords"><div style={{ width: '100%', height: '100%', background: 'var(--app-bg)' }} /></FallbackTracker>}>
                      <AppReadyNotifier app="chords" onReady={onReady} />
                      <SharedNavigationContainer activeView={cachedPanel} viewOrder={ALL_PANELS}>
                        {(panel) => (
                          <>
                            {panel === 'songs' && subApps.chords?.songs}
                            {panel === 'practice' && subApps.chords?.practice}
                            {panel === 'library' && subApps.chords?.library}
                            {panel === 'preferences' && subApps.chords?.preferences}
                          </>
                        )}
                      </SharedNavigationContainer>
                    </Suspense>
                  </ErrorBoundary>
                </div>
              </div>
            </AppEntryTransition>
          </ScreenScaffold>
        </SubAppScaffold>
      )}
    </>
  );
});
