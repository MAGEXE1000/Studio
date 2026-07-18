import { useChordStore, ACCENT_COLORS, useT, useBackHandler, useLiquidGlassNav, useNavCollapsed, useNavHidden, useIsWebDesktop, registerDebugProvider, unregisterDebugProvider, useNavigationStore, NavigationDispatcher, setNavCollapsed } from '@workspace/studio-core';
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

  return (
    <div className="groovex-root" style={{
      height: '100dvh', display: 'flex', flexDirection: 'column',
      background: 'var(--app-bg)',
      fontFamily: 'Manrope, sans-serif',
      paddingTop: 'env(safe-area-inset-top)',
      overflow: 'hidden',
    }}>

      {!isWebDesktop && (
        <header style={{
          display: 'flex', alignItems: 'center',
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
          <AppModeMenuLogo />
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

      {view !== 'player' && !isWebDesktop && (
        <GroovexNav view={view} setView={navigate} hasActiveSong={!!activeSongId} />
      )}
    </div>
  );
}

const NAV_ORDER: GroovexView[] = ['library', 'preferences'];

function GroovexNav({ view, setView, hasActiveSong }: {
  view: GroovexView;
  setView: (v: GroovexView) => void;
  hasActiveSong: boolean;
}) {
  const settings = useChordStore(useShallow(s => s.settings));
  const groovexVis = settings.perApp?.groovex ?? { theme: 'dark', accentColor: 'blue', amoledMode: false };
  const isLight = settings.theme === 'light' || (settings.theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches);
  const accent = ACCENT_COLORS[groovexVis.accentColor as keyof typeof ACCENT_COLORS] ?? ACCENT_COLORS.blue;
  const amoledBg = groovexVis.amoledMode
    ? 'rgba(0,0,0,0.96)'
    : (isLight ? 'rgba(255, 255, 255, 0.40)' : 'rgba(26,26,30,0.82)');

  const t = useT();
  const items: { id: GroovexView; icon: string; label: string }[] = [
    { id: 'library', icon: 'library_music', label: t.groovex.library },
    { id: 'preferences', icon: 'tune', label: t.groovex.preferences },
  ];

  const navRef = useRef<HTMLElement | null>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const prevIdxRef = useRef(NAV_ORDER.indexOf(view));
  const stretchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [pill, setPill] = useState<{ left: number; right: number; ready: boolean }>({ left: 0, right: 0, ready: false });
  const [pressedId, setPressedId] = useState<GroovexView | null>(null);
  const navCollapsed = useNavCollapsed();
  const navHidden    = useNavHidden();
  const [expandedH, setExpandedH] = useState(56);
  const [expandedW, setExpandedW] = useState(280);
  useEffect(() => {
    if (navRef.current) {
      setExpandedH(navRef.current.offsetHeight);
      setExpandedW(navRef.current.offsetWidth);
    }
  }, []);

  const measureBtn = (idx: number): { left: number; right: number } | null => {
    const btn = btnRefs.current[idx];
    const nav = navRef.current;
    if (!btn || !nav) return null;
    const navRect = nav.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    return { left: btnRect.left - navRect.left, right: btnRect.right - navRect.left };
  };

  useEffect(() => {
    const m = measureBtn(NAV_ORDER.indexOf(view));
    if (m) setPill({ left: m.left, right: m.right, ready: true });
  }, []);

  useEffect(() => {
    const newIdx = NAV_ORDER.indexOf(view);
    const oldIdx = prevIdxRef.current;
    if (newIdx === oldIdx) return;
    prevIdxRef.current = newIdx;
    setNavCollapsed(false);
    const newM = measureBtn(newIdx);
    if (!newM) return;

    if (stretchTimeoutRef.current) {
      clearTimeout(stretchTimeoutRef.current);
      stretchTimeoutRef.current = null;
      setPill(p => ({ ...p, left: newM.left, right: newM.right }));
      return;
    }

    if (newIdx > oldIdx) {
      setPill(p => ({ ...p, right: newM.right }));
      stretchTimeoutRef.current = setTimeout(() => {
        setPill(p => ({ ...p, left: newM.left }));
        stretchTimeoutRef.current = null;
      }, 90);
    } else {
      setPill(p => ({ ...p, left: newM.left }));
      stretchTimeoutRef.current = setTimeout(() => {
        setPill(p => ({ ...p, right: newM.right }));
        stretchTimeoutRef.current = null;
      }, 90);
    }

    return () => {
      if (stretchTimeoutRef.current) {
        clearTimeout(stretchTimeoutRef.current);
        stretchTimeoutRef.current = null;
      }
    };
  }, [view]);

  useLiquidGlassNav(navRef as React.RefObject<HTMLElement | null>);

  if (navHidden || navCollapsed) return null;

  return (
    <SharedNavigationBar
      items={items.map(item => ({
        key: item.id,
        icon: item.icon,
        label: item.label,
        isActive: view === item.id,
        onClick: () => setView(item.id),
      }))}
      isLight={isLight}
    />
  );
}

