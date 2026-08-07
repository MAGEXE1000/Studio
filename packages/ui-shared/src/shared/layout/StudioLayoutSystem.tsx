import { activeOverlaysRegistry } from '../design-system/dialogs';
import { useEffect } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

import { useScrollHide, SpringPresets } from '@workspace/studio-core';
import { ProgressiveBlur } from '../design-system/ProgressiveBlur';

// Helper hook to detect responsive design states (tablets, landscape, foldables)
export function useLayoutMetrics() {
  const [dimensions, setDimensions] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 360,
    height: typeof window !== 'undefined' ? window.innerHeight : 640,
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isLandscape = dimensions.width > dimensions.height;
  const isTablet = dimensions.width >= 768;
  const isFoldable = dimensions.width >= 600 && dimensions.width < 768 && isLandscape;
  const isLargeScreen = isTablet || isFoldable;

  return {
    ...dimensions,
    isLandscape,
    isTablet,
    isFoldable,
    isLargeScreen,
  };
}

// ── 1. ScreenScaffold ────────────────────────────────────────────────────────
// Enforces standard full-screen viewport layout and handles responsive margins.
export interface ScreenScaffoldProps extends React.HTMLAttributes<HTMLDivElement> {
  safeAreaTop?: boolean;
  safeAreaBottom?: boolean;
  children: React.ReactNode;
}

export function ScreenScaffold({
  safeAreaTop = true,
  safeAreaBottom = true,
  children,
  style,
  className = '',
  ...props
}: ScreenScaffoldProps) {
  const { isLargeScreen } = useLayoutMetrics();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden',
        background: 'var(--c-background)',
        paddingTop: safeAreaTop ? 'env(safe-area-inset-top, 0px)' : 0,
        paddingBottom: safeAreaBottom ? 'env(safe-area-inset-bottom, 0px)' : 0,
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
        ...style,
      }}
      className={`studio-screen-scaffold ${className}`}
      {...props}
    >
      <div
        style={{
          flex: 1,
          width: '100%',
          maxWidth: isLargeScreen ? '1024px' : '100%',
          margin: isLargeScreen ? '0 auto' : '0',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          height: '100%',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ── 2. ScrollScaffold ────────────────────────────────────────────────────────
// Standard scrollable body that keeps margins and bottom navigation pad safe.
export interface ScrollScaffoldProps extends React.HTMLAttributes<HTMLDivElement> {
  bottomSpacing?: boolean;
  children: React.ReactNode;
  disableScrollHide?: boolean;
}

export function ScrollScaffold({
  bottomSpacing = true,
  children,
  style,
  className = '',
  disableScrollHide = false,
  ...props
}: ScrollScaffoldProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  useScrollHide(ref, disableScrollHide);

  return (
    <div
      ref={ref}
      style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        boxSizing: 'border-box',
        padding: 'var(--spacing-md)',
        paddingBottom: bottomSpacing
          ? 'var(--content-bottom-pad)'
          : 'max(var(--spacing-md), env(safe-area-inset-bottom, 16px))',
        ...style,
      }}
      className={`studio-scroll-scaffold no-scrollbar ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// ── 3. SettingsScaffold ──────────────────────────────────────────────────────
// Drill down settings details viewport with back button and scroll container.
export interface SettingsScaffoldProps {
  title: string;
  onBack: () => void;
  toolbarActions?: React.ReactNode;
  children: React.ReactNode;
  hideBack?: boolean;
}

export interface SharedFloatingHeaderProps {
  title: string;
  onBack?: () => void;
  hideBack?: boolean;
  toolbarActions?: React.ReactNode;
  headerBgRef?: React.RefObject<HTMLDivElement | null>;
  titleRef?: React.RefObject<HTMLSpanElement | null>;
}

export function SharedFloatingHeader({
  title,
  onBack,
  hideBack,
  toolbarActions,
  headerBgRef,
  titleRef,
}: SharedFloatingHeaderProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(max(0px, env(safe-area-inset-top, 0px) - 8px))',
        left: 0,
        right: 0,
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 110,
        pointerEvents: 'none',
        padding: '0 16px',
      }}
    >
      {/* Floating rounded header card with live theme adaptive blur */}
      <div
        ref={headerBgRef}
        style={{
          position: 'absolute',
          top: 6,
          left: 12,
          right: 12,
          bottom: 6,
          background: 'var(--c-surface-glass-bg, rgba(20, 20, 25, 0.65))',
          borderRadius: '24px',
          border: '1px solid var(--c-border, rgba(128, 128, 128, 0.15))',
          backdropFilter: 'var(--c-surface-glass-blur, blur(20px))',
          WebkitBackdropFilter: 'var(--c-surface-glass-blur, blur(20px))',
          opacity: 0,
          transform: 'scale(0.96) translateY(-4px)',
          transition: 'opacity 150ms cubic-bezier(0.16, 1, 0.3, 1), transform 150ms cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: -1,
          pointerEvents: 'auto',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', width: '100%', pointerEvents: 'auto', gap: 12, height: '100%' }}>
        {!hideBack && onBack && (
          <button
            onClick={onBack}
            className="premium-back-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'var(--app-surface-low, rgba(128, 128, 128, 0.06))',
              border: '1px solid rgba(128, 128, 128, 0.08)',
              color: 'var(--c-text-primary)',
              cursor: 'pointer',
              transition: 'background-color 200ms',
              outline: 'none',
              flexShrink: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              arrow_back
            </span>
          </button>
        )}

        {/* Small Sticky Title */}
        <span
          ref={titleRef}
          style={{
            fontSize: '14px',
            fontWeight: 800,
            color: 'var(--c-text-primary)',
            letterSpacing: '-0.02em',
            fontFamily: 'Manrope',
            opacity: 0,
            transform: 'translateY(8px)',
            transition: 'opacity 150ms cubic-bezier(0.16, 1, 0.3, 1), transform 150ms cubic-bezier(0.16, 1, 0.3, 1)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
          }}
        >
          {title}
        </span>

        {toolbarActions && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {toolbarActions}
          </div>
        )}
      </div>
    </div>
  );
}

export function SettingsScaffold({
  title,
  onBack,
  toolbarActions,
  children,
  hideBack,
}: SettingsScaffoldProps) {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const headerBgRef = React.useRef<HTMLDivElement | null>(null);
  const titleRef = React.useRef<HTMLSpanElement | null>(null);
  const largeTitleRef = React.useRef<HTMLHeadingElement | null>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    // Transition range: 0px to 48px
    const progress = Math.min(1, Math.max(0, scrollTop / 48));

    if (headerBgRef.current) {
      headerBgRef.current.style.opacity = String(progress);
      headerBgRef.current.style.transform = `scale(${0.96 + progress * 0.04}) translateY(${Math.max(0, (1 - progress) * -4)}px)`;
    }
    if (titleRef.current) {
      titleRef.current.style.opacity = String(progress);
      titleRef.current.style.transform = `translateY(${Math.max(0, 8 - progress * 8)}px)`;
    }
    if (largeTitleRef.current) {
      largeTitleRef.current.style.opacity = String(Math.max(0, 1 - progress * 1.5));
    }
  };

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        zIndex: 100,
        background: 'var(--c-background)',
      }}
      className="studio-settings-scaffold"
    >
      <SharedFloatingHeader
        title={title}
        onBack={onBack}
        hideBack={hideBack}
        toolbarActions={toolbarActions}
        headerBgRef={headerBgRef}
        titleRef={titleRef}
      />

      {/* Continuous Scrolling View */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          boxSizing: 'border-box',
          padding: 'var(--density-pad, 16px)',
          paddingTop: 'calc(max(0px, env(safe-area-inset-top, 0px) - 8px) + 64px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 96px)',
        }}
        className="no-scrollbar"
      >
        {/* Large scrolling title */}
        <h2
          ref={largeTitleRef}
          style={{
            fontSize: 'var(--font-hero, 28px)',
            fontWeight: 800,
            color: 'var(--c-text-primary)',
            margin: '0 0 20px 4px',
            letterSpacing: '-0.03em',
            fontFamily: 'Manrope',
            transition: 'opacity 100ms linear',
          }}
        >
          {title}
        </h2>

        {/* Content Canvas */}
        <div style={{ width: '100%' }}>
          {children}
        </div>
      </div>
    </div>
  );
}


// ── 5. HubScaffold ──────────────────────────────────────────────────────────
// Responsive Scaffold structure specifically optimized for main Studio Hub dashboard layouts.
export interface HubScaffoldProps {
  toolbar: React.ReactNode;
  bottomNavigation?: React.ReactNode;
  children: React.ReactNode;
}

export function HubScaffold({ toolbar, bottomNavigation, children }: HubScaffoldProps) {
  const { isLargeScreen } = useLayoutMetrics();

  return (
    <ScreenScaffold safeAreaTop={false} safeAreaBottom={false}>
      {/* Fixed top toolbar */}
      <div style={{ flexShrink: 0, zIndex: 10 }}>{toolbar}</div>

      {/* Main dashboard viewport grid */}
      <div
        style={{
          flex: 1,
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {children}
      </div>

      {/* Optional bottom navigation */}
      {bottomNavigation && <div style={{ flexShrink: 0, zIndex: 10 }}>{bottomNavigation}</div>}
    </ScreenScaffold>
  );
}

// ── 6. SubAppScaffold ────────────────────────────────────────────────────────
// Responsive fullscreen wrapper for full-canvas nested modules.
export interface SubAppScaffoldProps {
  appKey: string;
  children: React.ReactNode;
  onReady?: () => void;
}

export function SubAppScaffold({ appKey, children, onReady }: SubAppScaffoldProps) {
  return (
    <div
      className="app-sub-app-container"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--c-background)',
      }}
    >
      {children}
    </div>
  );
}
