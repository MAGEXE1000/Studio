import { activeOverlaysRegistry } from '../design-system/dialogs';
import { lazy, Suspense, useCallback, useEffect, useRef, useState, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  useChordStore,
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
import { AppEntryTransition, useAnimationSpeed } from '../../shared/animation';
import { SubAppScaffold, ScreenScaffold } from './StudioLayoutSystem';
import { SharedNavigationContainer } from '../../navigation/SharedNavigationContainer';
import { ApplicationTransitionEngine } from '../../shared/animation';
import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { Toaster } from '../../components/ui/sonner';

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
    devtools?: React.ReactNode;
    groovex: React.ReactNode;
    vocalex: React.ReactNode;
    stagex: React.ReactNode;
    drumex: React.ReactNode;
    chordex: {
      sidebar?: React.ReactNode;
      songs: React.ReactNode;
      practice: React.ReactNode;
      library: React.ReactNode;
      preferences: React.ReactNode;
    };
  };
}


const InspectorRouteTracer = lazy(() => import('./InspectorRouteTracer').then(m => ({ default: m.InspectorRouteTracer })));

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
    if (last?.app === 'chordex' && last.page === 'chord') {
      return 'library';
    }
    return last?.app === 'chordex' && last.page ? (last.page as ActivePanel) : 'library';
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

    void StartupCoordinator.run(() => {});

    return () => {
      unsub();
      StartupCoordinator.cancel('app_unmounted');
    };
  }, []);

  // Global Orientation Policy: Lock non-stage views to Portrait mode
  useEffect(() => {
    const enforcePortrait = async () => {
      try {
        if (routeApp !== 'stagex') {
          if (Capacitor.isNativePlatform()) {
            await ScreenOrientation.lock({ orientation: 'portrait' });
          } else if (
            typeof window !== 'undefined' &&
            window.screen &&
            window.screen.orientation &&
            (window.screen.orientation as any).lock
          ) {
            await (window.screen.orientation as any).lock('portrait');
          }
        }
      } catch (e) {
        // Ignore orientation lock errors
      }
    };
    enforcePortrait();
  }, [routeApp]);

  // Sync loop removed

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
  const transitionPreviousAppModeRef = useRef<AppKey | 'hub'>(routeApp || 'hub');
  const transitionActive = useNavigationStore((s) => s.isTransitioning);

  useEffect(() => {
    const appMode = routeApp || 'hub';
    if (appMode !== transitionPreviousAppModeRef.current) {
      const ok = requestTransition(appMode as any);
      if (ok) {
        transitionPreviousAppModeRef.current = appMode as any;
        if (appMode === 'hub') {
          setAppPreloaded(true);
        }
      }
    }
  }, [routeApp, requestTransition, setAppPreloaded]);

  const handleAppPreloaded = useCallback(
    (app: AppKey) => {
      if (routeApp !== app) return;
      setAppPreloaded(true);
    },
    [routeApp, setAppPreloaded]
  );

  const appMode = routeApp || 'hub';
  const isSubAppActive = appMode !== 'hub' || launchingApp !== null;
  const stableKey = launchingApp || appMode;

  // Forensics watchdogs (kept globally so Web benefits from resilient recovering)
  useEffect(() => {
    (window as any).__runRootWatchdogCheck = (name: string) => {
      const currentMode = NavigationDispatcher.currentApp() || 'hub';
      const rootNode = document.getElementById('root');
      const appContainer = document.querySelector('.app-container');
      if (currentMode === 'hub' && rootNode && !appContainer) {
        if (typeof (window as any).__forceRerenderApp === 'function') {
          (window as any).__forceRerenderApp();
        }
        // @ts-ignore - injected global watchdog variable
        window.studioTransitionActive = false;
        NavigationDispatcher.reset([{ app: 'hub', tab: 'home' }]);
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
      {settings.developerMode && isInspectorEnabled && showRouteTracer && <Suspense fallback={null}><InspectorRouteTracer /></Suspense>}
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
  return (
    <>
      {app === 'devtools' && subApps.devtools && (
        <SubAppScaffold appKey="devtools">
          <ErrorBoundary moduleName="DevTools">
            <AppReadyNotifier app="devtools" onReady={onReady} />
            <AppEntryTransition>
              {subApps.devtools}
            </AppEntryTransition>
          </ErrorBoundary>
        </SubAppScaffold>
      )}

      {app === 'groovex' && subApps.groovex && (
        <SubAppScaffold appKey="groovex">
          <ErrorBoundary moduleName="Groovex">
            <AppReadyNotifier app="groovex" onReady={onReady} />
            <AppEntryTransition>
              {subApps.groovex}
            </AppEntryTransition>
          </ErrorBoundary>
        </SubAppScaffold>
      )}

      {app === 'vocalex' && subApps.vocalex && (
        <SubAppScaffold appKey="vocalex">
          <ErrorBoundary moduleName="Vocalex">
            <AppReadyNotifier app="vocalex" onReady={onReady} />
            <AppEntryTransition>
              {subApps.vocalex}
            </AppEntryTransition>
          </ErrorBoundary>
        </SubAppScaffold>
      )}

      {app === 'stagex' && subApps.stagex && (
        <SubAppScaffold appKey="stagex">
          <ErrorBoundary moduleName="Stagex">
            <AppReadyNotifier app="stagex" onReady={onReady} />
            <AppEntryTransition>
              {subApps.stagex}
            </AppEntryTransition>
          </ErrorBoundary>
        </SubAppScaffold>
      )}

      {app === 'drumex' && subApps.drumex && (
        <SubAppScaffold appKey="drumex">
          <ErrorBoundary moduleName="Drumex">
            <AppReadyNotifier app="drumex" onReady={onReady} />
            <AppEntryTransition>
              {subApps.drumex}
            </AppEntryTransition>
          </ErrorBoundary>
        </SubAppScaffold>
      )}

      {app === 'chordex' && subApps.chordex && (
        <SubAppScaffold appKey="chordex">
          <ScreenScaffold safeAreaTop={true} safeAreaBottom={false} className="app-bg">
            <AppEntryTransition className="flex flex-col w-full overflow-hidden select-none" style={{ position: 'relative', height: '100%' } as any}>
              <div style={{ display: 'flex', flexDirection: subApps.chordex.sidebar ? 'row' : 'column', flex: 1, width: '100%', height: '100%', overflow: 'hidden' }}>
                {subApps.chordex.sidebar}
                <div className="flex-1 overflow-hidden relative" style={{ contain: 'strict' }}>
                  <ErrorBoundary moduleName="Chordex">
                    <AppReadyNotifier app="chordex" onReady={onReady} />
                    <SharedNavigationContainer activeView={activePanel} viewOrder={ALL_PANELS}>
                      {(panel) => (
                        <>
                          {panel === 'songs' && subApps.chordex?.songs}
                          {panel === 'practice' && subApps.chordex?.practice}
                          {panel === 'library' && subApps.chordex?.library}
                          {panel === 'preferences' && subApps.chordex?.preferences}
                        </>
                      )}
                    </SharedNavigationContainer>
                  </ErrorBoundary>
                </div>
              </div>
            </AppEntryTransition>
          </ScreenScaffold>
        </SubAppScaffold>
      )}
      <Toaster />
    </>
  );
});
