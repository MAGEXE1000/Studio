import { useBackHandler, useChordStore, ACCENT_COLORS, type AppKey, useT, resetNav, setNavCollapsed, useNavHidden, useNavCollapsed, useLiquidGlassNav, useIsWebDesktop, registerDebugProvider, unregisterDebugProvider, useNavigationStore, NavigationDispatcher, useScrollHide } from '@workspace/studio-core';
import { useShallow } from 'zustand/react/shallow';
import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { SharedNavigationContainer } from '../../../navigation/SharedNavigationContainer';
import { AppModeMenuLogo } from '../../../components/icons/AppModeMenuLogo';
import { subscribeVocalexBack } from '../utilities/headerBack';
import { SHARED_NAV_TRANSITION, getSharedNavTransform, getSharedNavOpacity } from '../../../navigation/navStyles';
import WebAppSectionDock from '../../../components/feature/WebAppSectionDock';

import { IconSettings } from '../../../navigation/BottomNav';

const CoachPanelLazy = lazy(() => import('../components/CoachPanel').then(m => ({ default: m.default || m })));
const TakesPanelLazy = lazy(() => import('../components/TakesPanel').then(m => ({ default: m.default || m })));
const RecordingViewLazy = lazy(() => import('../components/RecordingView').then(m => ({ default: m.default || m })));

type VocalexPanel = 'coach' | 'recorder' | 'takes' | 'preferences';

const NAV_ORDER: VocalexPanel[] = ['coach', 'recorder', 'takes', 'preferences'];

function IconMic({ active }: { active: boolean }) {
  const sw = active ? 2 : 1.6;
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <rect x="9" y="5" width="6" height="10" rx="3" strokeWidth={sw} />
      <path d="M5 12a7 7 0 0 0 14 0" strokeWidth={sw} />
      <line x1="12" y1="19" x2="12" y2="22" strokeWidth={sw} />
      <line x1="8" y1="22" x2="16" y2="22" strokeWidth={sw} />
    </svg>
  );
}

function IconCoach({ active }: { active: boolean }) {
  const sw = active ? 2 : 1.6;
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" strokeWidth={sw} />
      <path d="M12 14c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z" strokeWidth={sw} />
      <path d="M18 6a3 3 0 0 1 0 4" strokeWidth={sw} />
      <path d="M20.5 4.5a6 6 0 0 1 0 7" strokeWidth={sw} />
    </svg>
  );
}

function IconTakes({ active }: { active: boolean }) {
  const sw = active ? 2 : 1.6;
  const ao = active ? 1 : 0;
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <rect x="3" y="3" width="18" height="18" rx="3" strokeWidth={sw} />
      <path d="M3 9h18" strokeWidth={sw} />
      <circle cx="12" cy="15" r="3" fill="currentColor" fillOpacity={ao} strokeWidth={sw} style={{ transition: 'fill-opacity 140ms ease' }} />
    </svg>
  );
}

function IconPreferences({ active }: { active: boolean }) {
  const sw = active ? 2 : 1.6;
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <circle cx="12" cy="12" r="3" strokeWidth={sw} />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" strokeWidth={sw} />
    </svg>
  );
}





export default function VocalexApp() {
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
  const settings = useChordStore(useShallow(s => s.settings));
  const t = useT();
  const vt = t.vocalex as any;
  // Restore last-visited Vocalex tab so a refresh / app-switch lands the
  // user where they left off. Falls back to defaultVocalexTab.
  const initialVocalexTab: VocalexPanel = (() => {
    const s = useChordStore.getState();
    if (!s.settings.restoreLastSession) {
      const def = s.settings.defaultVocalexTab as any;
      return def === 'practice' || def === 'vocalLab' || def === 'pitch' ? 'coach' : (def || 'coach');
    }
    const saved = s.lastSession?.vocalexTab as any;
    return saved === 'coach' || saved === 'recorder' || saved === 'takes' || saved === 'preferences'
      ? (saved as VocalexPanel)
      : 'coach';
  })();
  const activeTab = useNavigationStore(s => {
    const last = s.history[s.history.length - 1];
    return (last?.app === 'vocalex' && last.page && NAV_ORDER.includes(last.page as VocalexPanel)
      ? (last.page as VocalexPanel)
      : initialVocalexTab);
  });

  // Persist the active tab on every change so cold-start can resume here.
  useEffect(() => {
    useChordStore.getState().setLastSession({ vocalexTab: activeTab });
    resetNav();
  }, [activeTab]);

  const handleRecordingComplete = async (take: any) => {
    const { saveTake } = await import('@workspace/studio-core');
    await saveTake(take);
    NavigationDispatcher.push({ app: 'vocalex', page: 'takes', subView: 'detail', id: take.id });
  };

  const appKey = 'vocalex' as AppKey;
  const activeVis = settings.perApp?.[appKey] ?? { theme: 'dark' as const, accentColor: 'blue' as const, amoledMode: false };
  const accent = ACCENT_COLORS[activeVis.accentColor] ?? ACCENT_COLORS.blue;
  const isLight = (() => {
    if (activeVis.theme === 'light') return true;
    if (activeVis.theme === 'system') {
      return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches;
    }
    if (activeVis.theme === 'dynamic') {
      const h = new Date().getHours();
      const lightStart = settings.dynamicLightStart ?? 7;
      const lightEnd   = settings.dynamicLightEnd   ?? 20;
      return h >= lightStart && h < lightEnd;
    }
    return false;
  })();

  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const activeVisAccentRef = useRef(activeVis.accentColor);
  activeVisAccentRef.current = activeVis.accentColor;
  const isLightRef = useRef(isLight);
  isLightRef.current = isLight;

  useEffect(() => {
    registerDebugProvider({
      id: 'vocalex',
      name: 'Vocalex App',
      getDebugState: () => ({
        activeTab: activeTabRef.current,
        accentColor: activeVisAccentRef.current,
        isLight: isLightRef.current
      })
    });
    return () => {
      unregisterDebugProvider('vocalex');
    };
  }, []);

  const NAV_ITEMS: { panel: VocalexPanel; Icon: React.FC<{ active: boolean }>; label: string }[] = [
    { panel: 'coach',       Icon: IconCoach,       label: vt.navCoach || 'Coach' },
    { panel: 'recorder',    Icon: IconMic,         label: vt.navRecorder || 'Recorder' },
    { panel: 'takes',       Icon: IconTakes,       label: vt.navTakes },
    { panel: 'preferences', Icon: IconSettings,    label: vt.navPreferences || 'Preferences' },
  ];

  const navRef = useRef<HTMLElement | null>(null);
  useLiquidGlassNav(navRef);
  // Fixed nav height - same rationale as BottomNav: always 64px, dynamic
  // measurement was a race condition that returned 64 anyway.
  const NAV_HEIGHT_PX = 56;
  const [expandedW, setExpandedW] = useState(350);
  useEffect(() => {
    if (navRef.current) setExpandedW(navRef.current.offsetWidth);
  }, []);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const prevIdxRef = useRef(0);

  const pitchScrollRef       = useRef<HTMLDivElement | null>(null);
  const recorderScrollRef    = useRef<HTMLDivElement | null>(null);
  const takesScrollRef       = useRef<HTMLDivElement | null>(null);
  const preferencesScrollRef = useRef<HTMLDivElement | null>(null);

  const activeScrollRef =
    activeTab === 'coach'       ? pitchScrollRef :
    activeTab === 'recorder'    ? recorderScrollRef :
    activeTab === 'takes'       ? takesScrollRef :
                                  preferencesScrollRef;

  useScrollHide(activeScrollRef, activeTab);

  const navHidden   = useNavHidden();
  const navCollapsed = useNavCollapsed();
  const [headerBack, setHeaderBack] = useState<(() => void) | null>(null);
  useEffect(() => subscribeVocalexBack(fn => setHeaderBack(() => fn)), []);

  useBackHandler('nested', () => {
    if (headerBack) { headerBack(); return true; }
    return false;
  }, [headerBack]);



  const stretchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pill, setPill] = useState<{ left: number; right: number; ready: boolean }>({ left: 0, right: 0, ready: false });
  const [pressedPanel, setPressedPanel] = useState<VocalexPanel | null>(null);

  const measureBtn = (idx: number): { left: number; right: number } | null => {
    const btn = btnRefs.current[idx];
    const nav = navRef.current;
    if (!btn || !nav) return null;
    const navRect = nav.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    return { left: btnRect.left - navRect.left, right: btnRect.right - navRect.left };
  };

  useEffect(() => {
    // Measure the button for the actual initial tab, not always index 0.
    const initIdx = NAV_ORDER.indexOf(initialVocalexTab);
    const m = measureBtn(initIdx >= 0 ? initIdx : 0);
    if (m) setPill({ left: m.left, right: m.right, ready: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const newIdx = NAV_ORDER.indexOf(activeTab);
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
  }, [activeTab]);

  const amoledBg = isLight
    ? activeVis.amoledMode
      ? 'rgba(255, 255, 255, 0.92)'
      : 'rgba(255, 255, 255, 0.40)'
    : activeVis.amoledMode
      ? 'rgba(4,4,4,0.88)'
      : 'rgba(26,26,30,0.72)';

  const durMs = settings.animationSpeed === 'fast' ? 200 : settings.animationSpeed === 'reduced' ? 0 : 280;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden',
      paddingTop: 'env(safe-area-inset-top)',
      background: 'var(--app-bg)',
      '--panel-dur':      `${durMs}ms`,
      '--panel-exit-dur': `${Math.round(durMs * 0.65)}ms`,
    } as React.CSSProperties}>
      
      {!isWebDesktop && (
        <header className="flex-none px-6 pt-6 pb-1 spring-in" style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            overflow: 'hidden',
            flexShrink: 0,
            width: headerBack ? '40px' : '0px',
            opacity: headerBack ? 1 : 0,
            transition: 'width 300ms cubic-bezier(0.34,1.1,0.64,1), opacity 200ms ease',
          }}>
            <button
              onClick={() => {
                headerBack?.();
              }}
              data-testid="vocalex-back-button"
              aria-label={t.vocalex.back}
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'var(--app-surface-high)',
                border: '1px solid rgba(128,128,128,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', padding: 0,
                transition: 'background 500ms cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              <span className="material-symbols-outlined" style={{ color: 'var(--c-text-primary)', fontSize: '18px' }}>arrow_back</span>
            </button>
          </div>
          <h1 style={{
            fontSize: '14px', fontWeight: 700,
            color: 'var(--c-text-secondary)', fontFamily: 'Manrope', letterSpacing: '-0.02em',
            display: 'flex', alignItems: 'center', gap: '7px',
            margin: 0,
          }}>
            <AppModeMenuLogo />
          </h1>
        </header>
      )}

      {isWebDesktop && headerBack && (
        <header className="flex-none px-6 pt-5 pb-1" style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => headerBack?.()}
            data-testid="vocalex-back-button"
            aria-label={t.vocalex.back}
            className="btn-smooth"
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'var(--app-surface-high)',
              border: '1px solid rgba(128,128,128,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', padding: 0,
              transition: 'background 500ms cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            <span className="material-symbols-outlined" style={{ color: 'var(--c-text-primary)', fontSize: '18px' }}>arrow_back</span>
          </button>
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
            app="vocalex" 
            activeSection={activeTab} 
            onChangeSection={(p) => NavigationDispatcher.push({ app: 'vocalex', page: p })} 
          />
        )}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', paddingTop: isWebDesktop ? '20px' : '0px', paddingBottom: '0px', display: 'flex', flexDirection: 'column' }}>
          <SharedNavigationContainer
            activeView={activeTab}
            viewOrder={NAV_ORDER}
          >
            {(viewId) => {
              const scrollRef =
                viewId === 'coach'       ? pitchScrollRef :
                viewId === 'recorder'    ? recorderScrollRef :
                viewId === 'takes'       ? takesScrollRef :
                                           preferencesScrollRef;
              return (
                <div ref={scrollRef} style={{
                  position: 'absolute', inset: 0,
                  pointerEvents: activeTab === viewId ? 'auto' : 'none',
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  paddingBottom: 'var(--content-bottom-pad)',
                }}>
                  {viewId === 'coach' && <Suspense fallback={null}><CoachPanelLazy active={activeTab === 'coach'} /></Suspense>}
                  {viewId === 'recorder' && <Suspense fallback={null}><RecordingViewLazy onComplete={handleRecordingComplete} onCancel={() => NavigationDispatcher.push({ app: 'vocalex', page: 'takes' })} /></Suspense>}
                  {viewId === 'takes' && <Suspense fallback={null}><TakesPanelLazy /></Suspense>}
                  {viewId === 'preferences' && <VocalexPreferences />}
                </div>
              );
            }}
          </SharedNavigationContainer>
        </div>
      </div>

      <nav
        ref={navRef}
        className="glass-nav fixed"
        aria-hidden={(navHidden || navCollapsed) || undefined}
        // @ts-expect-error â€“ `inert` is valid HTML but missing from React types in this version
        inert={(navHidden || navCollapsed) ? '' : undefined}
        style={{
          display: isWebDesktop ? 'none' : undefined,
          position: 'fixed',
          bottom: 'var(--nav-safe-bottom)',
          left: '50%',
          width: '88%',
          maxWidth: '360px',
          height: `${NAV_HEIGHT_PX}px`,
          borderRadius: '2rem',
          border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.32)'}`,
          background: amoledBg,
          boxShadow: isLight
            ? '0 8px 32px rgba(0,0,0,0.08), 0 1.5px 0 rgba(255,255,255,0.70) inset'
            : '0 12px 48px rgba(0,0,0,0.50), 0 1.5px 0 rgba(255,255,255,0.08) inset',
          zIndex: 50,
          overflow: 'hidden',
          pointerEvents: (navHidden || navCollapsed) ? 'none' : 'auto',
          transform: getSharedNavTransform(navHidden, navCollapsed),
          opacity: getSharedNavOpacity(navHidden, navCollapsed),
          willChange: 'transform, opacity',
          transition: SHARED_NAV_TRANSITION,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          padding: '4px 6px',
          opacity: navCollapsed ? 0 : 1,
          transition: navCollapsed ? 'opacity 100ms cubic-bezier(0.2, 0.8, 0.2, 1)' : 'opacity 150ms cubic-bezier(0.2, 0.8, 0.2, 1) 80ms',
          willChange: 'opacity',
        }}>
        {pill.ready && (
          <div aria-hidden style={{
            position: 'absolute',
            top: '4px',
            left: pill.left,
            width: pill.right - pill.left,
            height: 'calc(100% - 8px)',
            borderRadius: '9999px',
            background: isLight ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.09)',
            border: isLight ? '1.5px solid rgba(0,0,0,0.06)' : '1.5px solid rgba(255,255,255,0.30)',
            boxShadow: isLight
              ? 'inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 8px rgba(0,0,0,0.08)'
              : 'inset 0 1px 0 rgba(255,255,255,0.40), 0 2px 16px rgba(255,255,255,0.06)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            pointerEvents: 'none',
            zIndex: 0,
            opacity: 1,
            transition: 'left 300ms cubic-bezier(0.16,1,0.3,1), width 300ms cubic-bezier(0.16,1,0.3,1)',
          }} />
        )}

        {NAV_ITEMS.map(({ panel, Icon, label }, i) => {
          const isActive = activeTab === panel;
          const isPressed = pressedPanel === panel;
          return (
            <button
              key={panel}
              ref={el => { btnRefs.current[i] = el; }}
              data-testid={`vocalex-nav-${panel}`}
              onPointerDown={() => setPressedPanel(panel)}
              onPointerUp={() => setPressedPanel(null)}
              onPointerLeave={() => setPressedPanel(null)}
              onPointerCancel={() => setPressedPanel(null)}
              onClick={() => NavigationDispatcher.push({ app: 'vocalex', page: panel })}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                padding: '6px 4px',
                borderRadius: '9999px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: isActive ? (isLight ? accent.from : '#fff') : 'var(--c-text-secondary)',
                position: 'relative',
                zIndex: 1,
                opacity: 1,
                transform: isPressed ? 'scale(0.91)' : 'scale(1)',
                transition: 'color 130ms ease, transform 120ms cubic-bezier(0.34,1.56,0.64,1)',
              }}
            >
              <Icon active={isActive} />
              <span style={{
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 700,
                fontSize: '9px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                lineHeight: 1,
                whiteSpace: 'nowrap',
                textShadow: isLight ? 'none' : '0 1px 4px rgba(0,0,0,0.60)',
              }}>
                {label}
              </span>
            </button>
          );
        })}
        </div>
      </nav>
    </div>
  );
}

function VocalexPreferences() {
  const settings = useChordStore(useShallow(s => s.settings));
  const updateSettings = useChordStore(useShallow(s => s.updateSettings));
  const t = useT();
  const vt = t.vocalex as any;
  const activeVis = settings.perApp?.vocalex ?? { theme: 'dark', accentColor: 'blue' };
  const acc = ACCENT_COLORS[activeVis.accentColor] ?? ACCENT_COLORS.blue;
  const isLight = activeVis.theme === 'light' || 
    (activeVis.theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches);

  const cur = settings.defaultVocalexTab ?? 'coach';
  const tabs = [
    { value: 'coach' as const, label: 'Coach', icon: 'school' },
    { value: 'recorder' as const, label: 'Recorder', icon: 'mic' },
    { value: 'takes' as const, label: 'Takes', icon: 'history' },
    { value: 'preferences' as const, label: 'Preferences', icon: 'tune' },
  ];

  return (
    <div style={{ padding: '24px 20px', minHeight: '100%' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{
          fontFamily: 'Manrope, sans-serif', fontWeight: 800,
          fontSize: 34, letterSpacing: '-0.03em',
          color: 'var(--c-text-primary)', margin: '0 0 8px', lineHeight: 1,
        }}>
          {vt.settingsTitle || 'Preferences'}
        </h2>
        <p style={{
          fontFamily: 'Inter, sans-serif', fontSize: 13,
          color: 'var(--c-text-secondary)', margin: 0, lineHeight: 1.5,
        }}>
          Configure default behaviors for Vocalex.
        </p>
      </div>

      <div style={{
        background: 'var(--app-surface, rgba(128,128,128,0.05))',
        borderRadius: '1.5rem',
        overflow: 'hidden',
        border: '1px solid rgba(128,128,128,0.1)',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, fontFamily: 'Manrope', color: 'var(--c-text-primary)' }}>
              Start On
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--c-text-secondary)', fontFamily: 'Inter', lineHeight: 1.4 }}>
              Choose which screen opens when you launch Vocalex.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {tabs.map(({ value, label, icon }) => {
              const active = cur === value;
              return (
                <button
                  key={value}
                  onClick={() => updateSettings({ defaultVocalexTab: value })}
                  title={label}
                  className="btn-smooth"
                  style={{
                    width: '40px', height: '40px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '10px',
                    border: active ? `2px solid ${acc.from}` : '2px solid transparent',
                    background: active 
                      ? `linear-gradient(135deg, ${acc.from}22, ${acc.to}18)` 
                      : (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)'),
                    color: active ? acc.from : 'var(--c-text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    flexShrink: 0,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{icon}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

