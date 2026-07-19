import { useChordStore, ACCENT_COLORS, useT, useBackHandler, useLiquidGlassNav, useNavCollapsed, useNavHidden, useIsWebDesktop, registerDebugProvider, unregisterDebugProvider, useNavigationStore, NavigationDispatcher, setNavCollapsed, useBottomNavigationStore, setNavHidden } from '@workspace/studio-core';
import { useShallow } from 'zustand/react/shallow';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useGroovexStore, type GroovexView } from '../state/useGroovexStore';
import { AppModeMenuLogo } from '../../../components/icons/AppModeMenuLogo';
import { SHARED_NAV_TRANSITION, getSharedNavTransform, getSharedNavOpacity } from '../../../navigation/navStyles';
import WebAppSectionDock from '../../../components/feature/WebAppSectionDock';
import { SharedNavigationContainer } from '../../../navigation/SharedNavigationContainer';
import { SharedNavigationBar, type SharedNavigationItem } from '../../../navigation/SharedNavigationBar';

const GroovexLibrary = lazy(() => import('../components/GroovexLibrary'));
const GroovexPlayer = lazy(() => import('../components/GroovexPlayer'));
const GroovexPreferences = lazy(() => import('../components/GroovexPreferences'));

const VIEW_ORDER: GroovexView[] = ['library', 'player', 'preferences'];

export default function GroovexApp() {
  const isWebDesktop = useIsWebDesktop();
  const initialGroovexView: GroovexView = (() => {
    const s = useChordStore.getState();
    if (!s.settings.restoreLastSession) return s.settings.defaultGroovexView || 'library';
    const saved = s.lastSession?.groovexView;
    return saved === 'library' || saved === 'player' || saved === 'preferences'
      ? saved
      : s.settings.defaultGroovexView || 'library';
  })();

  const view = useNavigationStore(s => {
    const last = s.history[s.history.length - 1];
    return (last?.app === 'groovex' && last.page && VIEW_ORDER.includes(last.page as GroovexView)
      ? (last.page as GroovexView)
      : initialGroovexView);
  });

  // Persist the active tab on every change so cold-start can resume here.
  useEffect(() => {
    useChordStore.getState().setLastSession({ groovexView: view });
  }, [view]);
  const activeSongId = useGroovexStore(useShallow(s => s.activeSongId));
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

  const viewRef = useRef(view);
  viewRef.current = view;
  const activeSongIdRef = useRef(activeSongId);
  activeSongIdRef.current = activeSongId;

  useEffect(() => {
    registerDebugProvider({
      id: 'groovex',
      name: 'Groovex App',
      getDebugState: () => ({
        activeSongId: activeSongIdRef.current || 'none',
        currentView: viewRef.current,
        playbackState: activeSongIdRef.current ? 'active' : 'stopped',
        grooveState: useGroovexStore.getState()
      })
    });
    return () => {
      unregisterDebugProvider('groovex');
    };
  }, []);

  function navigate(next: GroovexView) {
    NavigationDispatcher.push({ app: 'groovex', page: next });
  }

  function handleBack() {
    NavigationDispatcher.pop();
  }
  const t = useT();
  const settings = useChordStore(s => s.settings);
  const isLight = settings.theme === 'light' || (settings.theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches);

  useEffect(() => {
    if (isWebDesktop) return;
    setNavHidden(view === 'player');
  }, [view, isWebDesktop]);

  useEffect(() => {
    if (isWebDesktop || view === 'player') return;
    useBottomNavigationStore.getState().setItems([
      { key: 'library', icon: 'library_music', label: t.groovex.library, isActive: view === 'library', onClick: () => navigate('library') },
      { key: 'preferences', icon: 'tune', label: t.groovex.preferences, isActive: view === 'preferences', onClick: () => navigate('preferences') },
    ]);
    useBottomNavigationStore.getState().setIsLight(isLight);
  }, [view, isLight, isWebDesktop, t]);
  return (
    <div className="groovex-root" style={{
      height: '100dvh', display: 'flex', flexDirection: 'column',
      background: 'var(--app-bg)',
      fontFamily: 'var(--font-headline)',
      paddingTop: 'env(safe-area-inset-top)',
      overflow: 'hidden',
    }}>

      {!isWebDesktop && (
        <header style={{
          display: view === 'player' ? 'flex' : 'none', alignItems: 'center',
          padding: '24px 24px 4px', flexShrink: 0,
          background: 'var(--gx-bg)',
        }}>
          <div style={{
            overflow: 'hidden',
            flexShrink: 0,
            width: view === 'player' ? '40px' : '0px',
            opacity: view === 'player' ? 1 : 0,
            transition: 'width 300ms cubic-bezier(0.34,1.1,0.64,1), opacity 200ms ease',
          }}>
            <button
              onClick={handleBack}
              className="btn-smooth"
              aria-label="Back"
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--gx-surface-high)',
                border: '1px solid rgba(128,128,128,0.15)',
                cursor: 'pointer', padding: 0,
                transition: 'background 500ms cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              <span className="material-symbols-outlined" style={{ color: 'var(--c-text-primary)', fontSize: 18 }}>arrow_back</span>
            </button>
          </div>
        </header>
      )}

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
            app="groovex" 
            activeSection={view === 'player' ? 'library' : view} 
            onChangeSection={navigate} 
          />
        )}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', paddingTop: isWebDesktop ? '20px' : '0px', paddingBottom: '0px', display: 'flex', flexDirection: 'column' }}>
          <SharedNavigationContainer
            activeView={view}
            viewOrder={VIEW_ORDER}
          >
            {(viewId) => (
              <Suspense fallback={null}>
                {viewId === 'library' && <GroovexLibrary />}
                {viewId === 'player' && <GroovexPlayer />}
                {viewId === 'preferences' && <GroovexPreferences />}
              </Suspense>
            )}
          </SharedNavigationContainer>
        </div>
      </div>

      
    </div>
  );
}

const NAV_ORDER: GroovexView[] = ['library', 'preferences'];

