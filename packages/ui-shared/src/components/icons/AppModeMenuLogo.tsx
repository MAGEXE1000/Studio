import { useChordStore, ACCENT_COLORS, useIsWebDesktop, useNavigationStore, NavigationDispatcher, useLiquidGlassNav, useSettingsStore } from '@workspace/studio-core';
/**
 * AppModeMenuLogo — app switcher pill in every panel header.
 *
 * Visual model:
 *   Closed → [logo  Chordex  ▾]                       (compact pill)
 *   Open   →  [Chordex · Drumex · Stagex … ]
 *              floating glass pill, screen-centered horizontally,
 *              chips start from the left — tap one to switch app.
 */

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ChordexLogo,
  DrumexLogo,
  StudioLogo,
  StagexLogoIcon,
  GroovexLogo,
  VocalexLogo,
} from './ChordexLogo';

type AppValue = 'chords' | 'drums' | 'stage' | 'groovex' | 'vocalex';

export function AppModeMenuLogo({ color, size = 14 }: { color?: string; size?: number }) {
  const isWebDesktop = useIsWebDesktop();

  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const [open, setOpen] = useState(false);
  const [anchorY, setAnchorY] = useState<number>(0);
  const [maxPillWidth, setMaxPillWidth] = useState(360);

  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);

  useLiquidGlassNav(pillRef);

  // ── Theme-aware colors ────────────────────────────────────────────
  const appKey = NavigationDispatcher.currentApp();
  const activeVis = settings.perApp?.[appKey as keyof typeof settings.perApp] ?? {
    theme: settings.theme ?? 'dark',
    accentColor: settings.accentColor ?? 'blue',
    amoledMode: settings.amoledMode ?? false,
  };
  const isLight =
    (activeVis as { theme: string }).theme === 'light' ||
    ((activeVis as { theme: string }).theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: light)').matches);
  const resolvedColor = color ?? (isLight ? '#18181b' : '#d4d4d8');

  const accentKey = ((activeVis as { accentColor?: string }).accentColor ??
    settings.accentColor ??
    'blue') as keyof typeof ACCENT_COLORS;
  const accent = ACCENT_COLORS[accentKey] ?? ACCENT_COLORS.blue;

  const borderColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
  const bgColor = isLight ? 'rgba(252,252,253,0.98)' : 'rgba(18,18,22,0.96)';
  const idleChipBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
  const idleChipFg = isLight ? 'rgba(0,0,0,0.62)' : 'rgba(225,225,230,0.85)';
  const chipBorder = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';

  // ── Outside click / Esc dismiss ───────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const insideTrigger = wrapRef.current?.contains(target) ?? false;
      const insidePill = pillRef.current?.contains(target) ?? false;
      if (!insideTrigger && !insidePill) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close, { passive: true });
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // ── Measure vertical anchor + viewport-safe max width on open ─────
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const t = triggerRef.current;
      if (!t) return;
      const rect = t.getBoundingClientRect();
      setAnchorY(rect.top + rect.height / 2);
      const room = window.innerWidth - 32;
      setMaxPillWidth(Math.max(180, Math.min(420, room)));
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      window.removeEventListener('scroll', update);
    };
  }, [open]);

  const currentMode = NavigationDispatcher.currentApp() as AppValue | 'hub';

  const OPTIONS: { value: AppValue; Icon: React.FC<{ size?: number }>; label: string }[] = [
    { value: 'chords', Icon: ChordexLogo, label: 'Chordex' },
    { value: 'drums', Icon: DrumexLogo, label: 'Drumex' },
    { value: 'stage', Icon: StagexLogoIcon, label: 'Stagex' },
    { value: 'groovex', Icon: GroovexLogo, label: 'Groovex' },
    { value: 'vocalex', Icon: VocalexLogo, label: 'Vocalex' },
  ];

  const select = (val: AppValue) => {
    setOpen(false);
    if (val !== currentMode) {
      const currentHistory = useNavigationStore.getState().history;
      const isCurrentlySubApp =
        currentHistory.length > 1 && currentHistory[currentHistory.length - 1].app !== 'hub';
      if (isCurrentlySubApp) {
        NavigationDispatcher.replace({ app: val as any });
      } else {
        NavigationDispatcher.push({ app: val as any });
      }
    }
  };
  const goToHub = () => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent('studio-hub-return'));
  };

  const ACTIVE_LABEL: Record<string, string> = {
    chords: 'Chordex',
    drums: 'Drumex',
    stage: 'Stagex',
    groovex: 'Groovex',
    vocalex: 'Vocalex',
  };
  const activeLabel = ACTIVE_LABEL[currentMode] ?? 'Chordex';
  const ActiveIcon =
    currentMode === 'drums'
      ? DrumexLogo
      : currentMode === 'stage'
        ? StagexLogoIcon
        : currentMode === 'groovex'
          ? GroovexLogo
          : currentMode === 'vocalex'
            ? VocalexLogo
            : ChordexLogo;

  const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
  const SMOOTH = 'cubic-bezier(0.4, 0, 0.2, 1)';
  const chipDelay = (i: number): number => (open ? 140 + i * 32 : 0);

  const ALL_CHIPS: {
    key: string;
    label: string;
    Icon: React.FC<{ size?: number }>;
    onClick: () => void;
    isActive: boolean;
  }[] = [
    ...OPTIONS.map((opt) => ({
      key: opt.value,
      label: opt.label,
      Icon: opt.Icon,
      onClick: () => select(opt.value),
      isActive: currentMode === opt.value,
    })),
    {
      key: 'hub',
      label: 'Hub',
      Icon: StudioLogo,
      onClick: goToHub,
      isActive: false,
    },
  ];

  const collapseTransition = open
    ? `max-width 240ms ${SMOOTH}, opacity 160ms ${SMOOTH}, transform 220ms ${SMOOTH}`
    : `max-width 320ms ${SPRING} 80ms, opacity 220ms ${SMOOTH} 140ms, transform 320ms ${SPRING} 80ms`;

  if (isWebDesktop) return null;

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', display: 'inline-flex', verticalAlign: 'middle' }}
    >
      <style>{`
        .app-mode-swipe::-webkit-scrollbar { display: none; }
      `}</style>

      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: open ? 0 : 6,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 6px 4px 0',
          margin: '-4px 0',
          color: resolvedColor,
          pointerEvents: open ? 'none' : 'auto',
          transition: `gap 280ms ${open ? SMOOTH : SPRING}`,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            overflow: 'hidden',
            maxWidth: open ? 0 : size + 4,
            opacity: open ? 0 : 1,
            transform: open ? 'scale(0.6)' : 'scale(1)',
            transition: collapseTransition,
          }}
        >
          <ActiveIcon size={size} />
        </span>

        <span
          style={{
            display: 'inline-block',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            maxWidth: open ? 0 : 120,
            opacity: open ? 0 : 1,
            transform: open ? 'translateX(-4px)' : 'translateX(0)',
            transition: collapseTransition,
            fontSize: 13,
            fontWeight: 700,
            fontFamily: 'Manrope',
            letterSpacing: '-0.02em',
            color: resolvedColor,
          }}
        >
          {activeLabel}
        </span>

        <span
          style={{
            display: 'inline-block',
            overflow: 'hidden',
            maxWidth: open ? 0 : 12,
            opacity: open ? 0 : 0.45,
            marginLeft: open ? 0 : -2,
            fontSize: 9,
            color: resolvedColor,
            transform: open ? 'rotate(-180deg) scale(0.6)' : 'rotate(0deg) scale(1)',
            transition: collapseTransition,
          }}
        >
          ▾
        </span>
      </button>

      {createPortal(
        <div
          ref={pillRef}
          role="menu"
          aria-hidden={!open}
          className="glass-nav"
          style={{
            position: 'fixed',
            top: anchorY,
            left: '50%',
            transform: open
              ? 'translate(-50%, -50%) scale(1)'
              : 'translate(-50%, -50%) scale(0.55)',
            transformOrigin: 'center center',
            opacity: open ? 1 : 0,
            pointerEvents: open ? 'auto' : 'none',
            transition: open
              ? `transform 440ms ${SPRING}, opacity 220ms ease 60ms`
              : `transform 240ms ${SMOOTH}, opacity 180ms ease`,
            background: bgColor,
            border: isLight
              ? '1.5px solid rgba(0, 0, 0, 0.06)'
              : '1.5px solid rgba(255, 255, 255, 0.30)',
            borderRadius: 999,
            padding: '4px 6px',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxShadow: isLight
              ? '0 8px 32px rgba(0,0,0,0.12), 0 1px 0 rgba(255,255,255,0.7) inset'
              : '0 16px 48px rgba(0,0,0,0.50), 0 1px 0 rgba(255,255,255,0.08) inset',
            display: 'flex',
            alignItems: 'center',
            maxWidth: maxPillWidth,
            zIndex: 9999,
            willChange: 'transform, opacity',
            overflow: 'hidden',
          }}
        >
          {/*
          v3.0.55 — leftmost/rightmost chip text was being clipped by the
          pill's rounded edges. We give the scroll viewport horizontal
          padding (so the first/last chip sit clear of the rounded
          corners), match scroll-snap padding so wheel/touch scrolls land
          inside the visible area, and add a subtle edge fade so chips
          drift gracefully into the rounded corners instead of being
          chopped off mid-letter.
        */}
          <div
            ref={scrollRef}
            className="app-mode-swipe"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              padding: '0 4px',
              scrollPaddingInline: 8,
              maskImage:
                'linear-gradient(to right, transparent 0, #000 12px, #000 calc(100% - 12px), transparent 100%)',
              WebkitMaskImage:
                'linear-gradient(to right, transparent 0, #000 12px, #000 calc(100% - 12px), transparent 100%)',
            }}
          >
            {ALL_CHIPS.map((chip, i) => {
              const activeBg = `${accent.from}1f`;
              const activeBorder = `${accent.from}55`;
              const chipColor = chip.isActive ? accent.from : idleChipFg;
              return (
                <button
                  key={chip.key}
                  data-active={chip.isActive}
                  onClick={chip.onClick}
                  aria-label={chip.label}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    flexShrink: 0,
                    height: 30,
                    padding: '0 12px 0 9px',
                    borderRadius: 999,
                    background: chip.isActive ? activeBg : idleChipBg,
                    border: `1px solid ${chip.isActive ? activeBorder : chipBorder}`,
                    color: chipColor,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    opacity: open ? 1 : 0,
                    transform: open ? 'translateY(0) scale(1)' : 'translateY(4px) scale(0.92)',
                    transition: open
                      ? `opacity 240ms ${SMOOTH} ${chipDelay(i)}ms, transform 380ms ${SPRING} ${chipDelay(i)}ms, background 180ms ${SMOOTH}, color 180ms ${SMOOTH}, border-color 180ms ${SMOOTH}`
                      : `opacity 140ms ${SMOOTH}, transform 200ms ${SMOOTH}, background 180ms ${SMOOTH}, color 180ms ${SMOOTH}`,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 18,
                      height: 18,
                      color: chipColor,
                    }}
                  >
                    <chip.Icon size={13} />
                  </span>
                  <span
                    style={{
                      fontFamily: 'Manrope',
                      fontWeight: 700,
                      fontSize: 11.5,
                      letterSpacing: '-0.01em',
                      color: chipColor,
                    }}
                  >
                    {chip.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default AppModeMenuLogo;
