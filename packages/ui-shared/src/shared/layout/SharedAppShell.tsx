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
} from '@workspace/studio-core';

import { StudioHubSkeleton } from '../loading/StudioSkeleton';
import { ErrorBoundary } from '../feedback/ErrorBoundary';
import { AppEntryTransition, useAnimationSpeed } from '../../features/hub/animations/AppAnimationSystem';
import { SubAppScaffold, ScreenScaffold } from './StudioLayoutSystem';
import { SharedNavigationContainer } from '../../navigation/SharedNavigationContainer';
import { ApplicationTransitionEngine } from '../../features/hub/animations/ApplicationTransitionEngine';

const ALL_PANELS = ['songs', 'library', 'settings'] as const;

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
      settings: React.ReactNode;
    };
  };
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
    return last?.app === 'chords' && last.page ? (last.page as ActivePanel) : 'library';
  });
  const routeApp = useNavigationStore((s) => s.history[s.history.length - 1]?.app ?? 'hub');
  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const speedScale = useAnimationSpeed();
  
  const [hubRenderKey, setHubRenderKey] = useState(0);
  const [showHub, setShowHub] = useState(true);

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
                            {panel === 'settings' && subApps.chords?.settings}
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
