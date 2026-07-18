import { useChordStore, ACCENT_COLORS, type ActivePanel, type AppKey, useNavHidden, useNavCollapsed, useT, useLiquidGlassNav, useIsWebDesktop, useNavigationStore, NavigationDispatcher, setNavCollapsed } from '@workspace/studio-core';
import { useEffect, useRef, useState } from 'react';

import { SHARED_NAV_TRANSITION, getSharedNavTransform, getSharedNavOpacity } from './navStyles';
import { BottomNavigation } from '../components/StudioDesignSystem';
import { MOTION_DURATIONS, MOTION_EASINGS } from './AppAnimationSystem';


/* â”€â”€ Crisp inline SVG icons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export function IconSongs({ active }: { active: boolean }) {
  const sw = active ? 2.1 : 1.7;
  const ao = active ? 1 : 0;
  const easeCurve = `cubic-bezier(${MOTION_EASINGS.emphasized.join(',')})`;
  const trans = `fill-opacity ${MOTION_DURATIONS.fast * 1000}ms ${easeCurve}`;
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M9 18V7l10-2.5V16" stroke="currentColor" strokeWidth={sw}
        style={{ transition: `stroke-width ${MOTION_DURATIONS.veryFast * 1000}ms ${easeCurve}` }} />
      <circle cx="7" cy="18" r="2.5"
        fill="currentColor" fillOpacity={ao}
        stroke="currentColor" strokeWidth={sw - 0.2}
        style={{ transition: trans }} />
      <circle cx="17" cy="16" r="2.5"
        fill="currentColor" fillOpacity={ao}
        stroke="currentColor" strokeWidth={sw - 0.2}
        style={{ transition: trans }} />
    </svg>
  );
}

export function IconLibrary({ active }: { active: boolean }) {
  const sw = active ? 2 : 1.7;
  const ao = active ? 1 : 0;
  const easeCurve = `cubic-bezier(${MOTION_EASINGS.emphasized.join(',')})`;
  const trans = `fill-opacity ${MOTION_DURATIONS.fast * 1000}ms ${easeCurve}`;
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeLinejoin="round" style={{ display: 'block' }}>
      <rect x="3" y="4" width="5" height="16" rx="1.5" strokeWidth={sw}
        fill="currentColor" fillOpacity={ao} style={{ transition: trans }} />
      <rect x="10" y="7" width="4" height="13" rx="1.5" strokeWidth={sw}
        fill="currentColor" fillOpacity={ao} style={{ transition: `fill-opacity ${MOTION_DURATIONS.veryFast * 1000}ms ${easeCurve}` }} />
      <rect x="16" y="9" width="5" height="11" rx="1.5" strokeWidth={sw}
        fill="currentColor" fillOpacity={ao} style={{ transition: `fill-opacity ${MOTION_DURATIONS.veryFast * 1000}ms ${easeCurve}` }} />
    </svg>
  );
}

/* Guitar chord diagram â€” 3Ã—3 fret grid, dots on frets */
export function IconChords({ active }: { active: boolean }) {
  const sw     = active ? 1.8 : 1.5;
  const dotAo  = active ? 1 : 0;
  const easeCurve = `cubic-bezier(${MOTION_EASINGS.emphasized.join(',')})`;
  const dotTr  = `fill-opacity ${MOTION_DURATIONS.fast * 1000}ms ${easeCurve}`;
  const lineTr = `stroke-opacity ${MOTION_DURATIONS.fast * 1000}ms ${easeCurve}`;

  /* Grid: 3 strings (x = 6, 12, 18), 3 frets (y = 7, 12, 17) */
  const strings = [6, 12, 18];
  const frets   = [7, 12, 17];

  /* Dots to display (string index, fret index) */
  const dots = [[0, 1], [1, 0], [2, 2]];

  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" style={{ display: 'block' }}>
      {/* Nut (top thick bar) */}
      <line x1="4" y1="4.5" x2="20" y2="4.5"
        stroke="currentColor" strokeWidth={sw + 0.6} strokeLinecap="round"
        style={{ transition: 'stroke-width 120ms ease' }} />

      {/* Fret lines (horizontal) */}
      {frets.map((y, fi) => (
        <line key={`f${fi}`} x1="4" y1={y} x2="20" y2={y}
          stroke="currentColor" strokeWidth={sw - 0.5} strokeOpacity={active ? 0.5 : 0.45}
          style={{ transition: lineTr }} />
      ))}

      {/* String lines (vertical) */}
      {strings.map((x, si) => (
        <line key={`s${si}`} x1={x} y1="4.5" x2={x} y2="20"
          stroke="currentColor" strokeWidth={sw - 0.5} strokeOpacity={active ? 0.5 : 0.45}
          style={{ transition: lineTr }} />
      ))}

      {/* Fret dots */}
      {dots.map(([si, fi], i) => (
        <circle key={i}
          cx={strings[si]}
          cy={(frets[fi] + (fi > 0 ? frets[fi - 1] : 4.5)) / 2}
          r="2.4"
          fill="currentColor"
          fillOpacity={dotAo}
          stroke="currentColor"
          strokeWidth={active ? 0 : sw - 0.3}
          strokeOpacity={active ? 0 : 0.7}
          style={{ transition: dotTr }} />
      ))}
    </svg>
  );
}

export function IconSettings({ active }: { active: boolean }) {
  const sw = active ? 2 : 1.7;
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor"
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      {/* Three horizontal slider tracks */}
      <line x1="4" y1="6"  x2="20" y2="6"  />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
      {/* Knobs at different positions */}
      <circle cx="8"  cy="6"  r="2.2" fill={active ? 'currentColor' : 'var(--app-bg)'} />
      <circle cx="16" cy="12" r="2.2" fill={active ? 'currentColor' : 'var(--app-bg)'} />
      <circle cx="10" cy="18" r="2.2" fill={active ? 'currentColor' : 'var(--app-bg)'} />
    </svg>
  );
}

const NAV_ORDER: ActivePanel[] = ['songs', 'library', 'chord', 'settings'];

export default function BottomNav() {
  const isWebDesktop = useIsWebDesktop();
  const settings       = useChordStore(s => s.settings);

  const activeRoute = useNavigationStore(s => s.history[s.history.length - 1]) || { app: 'hub', tab: 'home' };
  let activePanel: ActivePanel = 'library';
  if (activeRoute.app === 'chords') {
    activePanel = (activeRoute.page as ActivePanel) || 'library';
  } else if (activeRoute.app === 'hub' && activeRoute.tab === 'settings') {
    activePanel = 'settings';
  }
  const t = useT();

  const NAV_ITEMS: { panel: ActivePanel; Icon: React.FC<{ active: boolean }>; label: string }[] = [
    { panel: 'songs',    Icon: IconSongs,    label: t.nav.songs    },
    { panel: 'library',  Icon: IconLibrary,  label: t.nav.library  },
    { panel: 'chord',    Icon: IconChords,   label: t.nav.chords   },
    { panel: 'settings', Icon: IconSettings, label: t.nav.settings },
  ];
  // Derive the active per-app visuals the same way App.tsx does (per-app beats global)
  const appKey    = (settings.appMode ?? 'hub') as AppKey;
  const activeVis = settings.perApp?.[appKey] ?? {
    theme:       settings.theme       ?? 'dark',
    accentColor: settings.accentColor ?? 'blue',
    amoledMode:  settings.amoledMode  ?? false,
  };
  const accent    = ACCENT_COLORS[activeVis.accentColor] ?? ACCENT_COLORS.blue;
  const isLight = settings.theme === 'light' || (settings.theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches);
  const amoledBg = isLight
    ? activeVis.amoledMode
      ? 'rgba(255, 255, 255, 0.92)'
      : 'rgba(255, 255, 255, 0.40)'
    : activeVis.amoledMode
      ? 'rgba(4,4,4,0.88)'
      : 'rgba(26,26,30,0.72)';
  const navHidden    = useNavHidden();
  const navCollapsed = useNavCollapsed();


  /* â”€â”€ Sliding pill state â”€â”€ */
  const navRef            = useRef<HTMLElement | null>(null);
  // Wire this nav into the shared liquid-glass renderer (no-op when the
  // setting is off or the platform isn't supported).
  useLiquidGlassNav(navRef);

  const prevIdxRef        = useRef(NAV_ORDER.indexOf(activePanel));
  const stretchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [pillStyle, setPillStyle] = useState<{ left: string; width: string }>({
    left: `calc(6px + ${NAV_ORDER.indexOf(activePanel)} * (100% - 12px) / 4)`,
    width: 'calc((100% - 12px) / 4)',
  });
  /* tracks which button is pressed for micro-interaction */
  const [pressedPanel, setPressedPanel] = useState<ActivePanel | null>(null);

  useEffect(() => {
    const idx = NAV_ORDER.indexOf(activePanel);
    const itemWidth = 'calc((100% - 12px) / 4)';
    const targetLeft = `calc(6px + ${idx} * (100% - 12px) / 4)`;

    const oldIdx = prevIdxRef.current;
    prevIdxRef.current = idx;
    setNavCollapsed(false);

    if (oldIdx === -1 || oldIdx === idx) {
      setPillStyle({ left: targetLeft, width: itemWidth });
      return;
    }

    if (stretchTimeoutRef.current) {
      clearTimeout(stretchTimeoutRef.current);
      stretchTimeoutRef.current = null;
    }

    if (idx > oldIdx) {
      // Stretch right
      const intermediateWidth = `calc((${idx - oldIdx + 1} * (100% - 12px) / 4))`;
      const startLeft = `calc(6px + ${oldIdx} * (100% - 12px) / 4)`;
      setPillStyle({ left: startLeft, width: intermediateWidth });
      stretchTimeoutRef.current = setTimeout(() => {
        setPillStyle({ left: targetLeft, width: itemWidth });
        stretchTimeoutRef.current = null;
      }, 90);
    } else {
      // Stretch left
      const intermediateWidth = `calc((${oldIdx - idx + 1} * (100% - 12px) / 4))`;
      setPillStyle({ left: targetLeft, width: intermediateWidth });
      stretchTimeoutRef.current = setTimeout(() => {
        setPillStyle({ left: targetLeft, width: itemWidth });
        stretchTimeoutRef.current = null;
      }, 90);
    }

    return () => {
      if (stretchTimeoutRef.current) clearTimeout(stretchTimeoutRef.current);
    };
  }, [activePanel]);

  if (isWebDesktop) return null;
  if (settings.appMode !== 'chords') return null;

  return (
    <BottomNavigation
      ref={navRef}
      className="glass-nav fixed"
      aria-hidden={(navHidden || navCollapsed) || undefined}
      // @ts-expect-error â€“ `inert` is valid HTML but missing from React types in this version
      inert={(navHidden || navCollapsed) ? '' : undefined}
      style={{
        pointerEvents: (navHidden || navCollapsed) ? 'none' : 'auto',
        transform: getSharedNavTransform(navHidden, navCollapsed),
        opacity: getSharedNavOpacity(navHidden, navCollapsed),
        willChange: 'transform, opacity',
        transition: SHARED_NAV_TRANSITION,
      }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        padding: '4px 6px',
        opacity: 1,
        willChange: 'opacity',
      }}>
      {/* â”€â”€ Elastic sliding pill â”€â”€ */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '4px',
          left:  pillStyle.left,
          width: pillStyle.width,
          height: 'calc(100% - 8px)',
          borderRadius: '9999px',
          // Liquid glass ring â€” flips for light vs dark
          background: isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.09)',
          border: isLight ? '1.5px solid rgba(0, 0, 0, 0.06)' : '1.5px solid rgba(255, 255, 255, 0.30)',
          boxShadow: isLight
            ? ['inset 0 1px 0 rgba(255,255,255,0.95)', '0 2px 8px rgba(0,0,0,0.08)'].join(', ')
            : ['inset 0 1px 0 rgba(255,255,255,0.40)', '0 2px 16px rgba(255,255,255,0.06)'].join(', '),
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 1,
          transition: `left ${MOTION_DURATIONS.normal * 1000}ms cubic-bezier(${MOTION_EASINGS.emphasized.join(',')}), width ${MOTION_DURATIONS.normal * 1000}ms cubic-bezier(${MOTION_EASINGS.emphasized.join(',')})`,
        }}
      />

      {/* â”€â”€ Nav buttons â”€â”€ */}
      {NAV_ITEMS.map(({ panel, Icon, label }) => {
        const isActive  = activePanel === panel;
        const isPressed = pressedPanel === panel;
        return (
          <button
            key={panel}
            data-testid={`nav-${panel}`}
            onPointerDown={() => setPressedPanel(panel)}
            onPointerUp={() => setPressedPanel(null)}
            onPointerLeave={() => setPressedPanel(null)}
            onPointerCancel={() => setPressedPanel(null)}
            onClick={() => {
              NavigationDispatcher.push({ app: 'chords', page: panel });
            }}
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
              color: isActive
                ? (isLight ? accent.from : '#fff')
                : 'var(--c-text-secondary)',
              position: 'relative',
              zIndex: 1,
              opacity: 1,
              /* No scale on active â€” avoids subpixel blur on non-retina screens */
              transform: isPressed ? 'scale(0.91)' : 'scale(1)',
              transition: `color ${MOTION_DURATIONS.veryFast * 1000}ms cubic-bezier(${MOTION_EASINGS.standard.join(',')}), transform ${MOTION_DURATIONS.veryFast * 1000}ms cubic-bezier(${MOTION_EASINGS.standard.join(',')})`,
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
    </BottomNavigation>
  );
}

