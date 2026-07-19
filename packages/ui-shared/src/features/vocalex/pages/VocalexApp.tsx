import { useBackHandler, useChordStore, ACCENT_COLORS, type AppKey, useT, resetNav, setNavCollapsed, useNavHidden, useNavCollapsed, useLiquidGlassNav, useIsWebDesktop, registerDebugProvider, unregisterDebugProvider, useNavigationStore, NavigationDispatcher, useScrollHide, useBottomNavigationStore } from '@workspace/studio-core';
import { useShallow } from 'zustand/react/shallow';
import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { SharedNavigationContainer } from '../../../navigation/SharedNavigationContainer';
import { SharedNavigationBar, type SharedNavigationItem } from '../../../navigation/SharedNavigationBar';
import { MOTION_DURATIONS, MOTION_EASINGS } from '../../../navigation/AppAnimationSystem';
import { AppModeMenuLogo } from '../../../components/icons/AppModeMenuLogo';
import { subscribeVocalexBack } from '../utilities/headerBack';
import { SHARED_NAV_TRANSITION, getSharedNavTransform, getSharedNavOpacity } from '../../../navigation/navStyles';
import WebAppSectionDock from '../../../components/feature/WebAppSectionDock';
import { Card } from '../../../components/design-system/StudioDesignSystem';

import { IconSettings } from '../../../components/icons/NavIcons';

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
  const NAV_HEIGHT_PX = 60;
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

  useEffect(() => {
    if (isWebDesktop) return;
    useBottomNavigationStore.getState().setItems(
      NAV_ITEMS.map(item => ({
        key: item.panel,
        icon: <item.Icon active={activeTab === item.panel} />,
        label: item.label,
        isActive: activeTab === item.panel,
        onClick: () => NavigationDispatcher.push({ app: 'vocalex', page: item.panel }),
      }))
    );
    useBottomNavigationStore.getState().setIsLight(isLight);
  }, [activeTab, isLight, isWebDesktop]);

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
    { value: 'coach' as const, label: 'Coach', Icon: IconCoach },
    { value: 'recorder' as const, label: 'Recorder', Icon: IconMic },
    { value: 'takes' as const, label: 'Takes', Icon: IconTakes },
    { value: 'preferences' as const, label: 'Preferences', Icon: IconSettings },
  ];

  return (
    <div style={{ padding: '24px 20px', minHeight: '100%' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{
          fontFamily: 'var(--font-headline)', fontWeight: 800,
          fontSize: 34, letterSpacing: '-0.03em',
          color: 'var(--c-text-primary)', margin: '0 0 8px', lineHeight: 1,
        }}>
          {vt.settingsTitle || 'Preferences'}
        </h2>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 13,
          color: 'var(--c-text-secondary)', margin: 0, lineHeight: 1.5,
        }}>
          Configure default behaviors for Vocalex.
        </p>
      </div>

      <Card style={{
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-headline)', color: 'var(--c-text-primary)' }}>
               Start On
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--c-text-secondary)', fontFamily: 'var(--font-body)', lineHeight: 1.4 }}>
              Choose which screen opens when you launch Vocalex.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {tabs.map(({ value, label, Icon }) => {
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
                  <Icon active={active} />
                </button>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}

