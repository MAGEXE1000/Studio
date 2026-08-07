import { SharedAppShell } from '@workspace/ui-shared/src/shared/layout/SharedAppShell';
import { lazy, useEffect, useRef, useState } from 'react';
import { tolgee, useSettingsStore } from '@workspace/studio-core';

import { TolgeeProvider } from '@tolgee/react';

import { LaunchAnimationEngine, BottomNavigationController } from '@workspace/ui-shared';

const SharedNavigationBar = lazy(() =>
  import('@workspace/ui-shared').then((m) => ({ default: m.SharedNavigationBar }))
);
const StudioHub = lazy(() =>
  import('@workspace/ui-shared').then((m) => ({ default: m.StudioHub }))
);
const LibraryPanel = lazy(() =>
  import('@workspace/ui-shared').then((m) => ({ default: m.LibraryPanel }))
);
const SettingsPanel = lazy(() =>
  import('@workspace/ui-shared').then((m) => ({ default: m.SettingsPanel }))
);
const SaxophonePracticePanel = lazy(() =>
  import('@workspace/ui-shared').then((m: any) => ({ default: m.SaxophonePracticePanel }))
);
const SongsPanel = lazy(() =>
  import('@workspace/ui-shared').then((m) => ({ default: m.SongsPanel }))
);
const DrumEditor = lazy(() =>
  import('@workspace/ui-shared').then((m) => ({ default: m.DrumEditor }))
);
const GroovexApp = lazy(() =>
  import('@workspace/ui-shared').then((m) => ({ default: m.GroovexApp }))
);
const VocalexApp = lazy(() =>
  import('@workspace/ui-shared').then((m) => ({ default: m.VocalexApp }))
);
const StageCorePanel = lazy(() =>
  import('@workspace/ui-shared').then((m) => ({ default: m.StageCorePanel }))
);
const DevToolsApp = lazy(() =>
  import('@workspace/ui-shared').then((m) => ({ default: m.DevToolsApp }))
);
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
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
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
      renderLaunchOverlay={showLaunchOverlay ? () => (
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
      ) : undefined}
      renderBottomNav={() => <BottomNavigationController />}
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
        }
      }}
    />
  );
}
