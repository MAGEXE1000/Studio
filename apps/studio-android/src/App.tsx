import { SharedAppShell } from '@workspace/ui-shared/src/shared/layout/SharedAppShell';
import { lazy, useEffect, useRef, useState } from 'react';
import { tolgee, useSettingsStore } from '@workspace/studio-core';

import { TolgeeProvider } from '@tolgee/react';

import {
  LaunchAnimationEngine,
  BottomNavigationController,
  SharedNavigationBar,
  StudioHub,
  LibraryPanel,
  SettingsPanel,
  SaxophonePracticePanel,
  SongsPanel,
  DrumEditor,
  GroovexApp,
  VocalexApp,
  StageCorePanel,
  DevToolsApp,
} from '@workspace/ui-shared';
import './index.css';

if (typeof window !== 'undefined') {
  (window as any).__preloadUIModules = () => {
    void import('@workspace/ui-shared');
    void import('@workspace/ui-android');
  };
}

export default function App() {
  const settings = useSettingsStore((s) => s.settings);
  const [showLaunchOverlay, setShowLaunchOverlay] = useState(true);
  const initialPresetRef = useRef<any>(
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'default'
      : 'default'
  );

  const [route, setRoute] = useState('/app');
  const navigateTo = (path: string) => {
    if (path === '/') return; // Never route to landing page on Android
    window.history.pushState({}, '', path);
    setRoute(path);
  };

  useEffect(() => {
    const handleIntroDone = () => {
      // Preflight checks
    };
    window.addEventListener('studio-intro-done', handleIntroDone);
    return () => window.removeEventListener('studio-intro-done', handleIntroDone);
  }, []);

  /* Note: safe-area-inset-top is handled by ScreenScaffold */

  return (
    <SharedAppShell
      isWeb={false}
      wrapProviders={(children) => (
        <TolgeeProvider tolgee={tolgee} fallback={null}>
          {children}
        </TolgeeProvider>
      )}
      renderLaunchOverlay={
        showLaunchOverlay
          ? () => (
              <LaunchAnimationEngine
                preset={initialPresetRef.current}
                skipIntro={false}
                onComplete={() => setShowLaunchOverlay(false)}
                isLight={
                  settings.theme === 'light' ||
                  (settings.theme === 'system' &&
                    typeof window !== 'undefined' &&
                    window.matchMedia('(prefers-color-scheme: light)').matches)
                }
                isAmoled={settings.perApp?.hub?.amoledMode}
              />
            )
          : undefined
      }
      renderBottomNav={!showLaunchOverlay ? () => <BottomNavigationController /> : undefined}
      hubElement={<StudioHub />}
      subApps={{
        devtools: <DevToolsApp />,
        groovex: <GroovexApp />,
        vocalex: <VocalexApp />,
        stagex: <StageCorePanel />,
        drumex: <DrumEditor />,
        chordex: {
          sidebar: null,
          songs: <SongsPanel />,
          practice: <SaxophonePracticePanel />,
          library: <LibraryPanel />,
          preferences: <SettingsPanel />,
        },
      }}
    />
  );
}
