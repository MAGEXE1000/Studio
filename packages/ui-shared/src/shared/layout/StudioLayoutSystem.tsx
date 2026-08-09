import { activeOverlaysRegistry } from '../design-system/dialogs';
import { useEffect } from 'react';
import React from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';

import { useScrollHide, SpringPresets, useSettingsStore } from '@workspace/studio-core';
import { ProgressiveBlur } from '../design-system/ProgressiveBlur';
import { StudioLogo } from '../../features/chordex/icons/ChordexLogo';

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
  titleRef?: React.RefObject<HTMLDivElement | null>;
  headerProgress?: any;
}

export function SharedFloatingHeader({
  title,
  onBack,
  hideBack,
  toolbarActions,
  headerBgRef,
  titleRef,
  headerProgress,
}: SharedFloatingHeaderProps) {
  const { isLargeScreen } = useLayoutMetrics();
  const sideMargin = isLargeScreen ? '20%' : '12%';

  // Read current theme to apply warm tinted translucency
  const settings = useSettingsStore((s) => s.settings);
  const isLight = settings.theme === 'light';

  const defaultProgress = useMotionValue(1);
  const progress = headerProgress ?? defaultProgress;

  const bgOpacity = useTransform(progress, [0, 1], [0, 1]);
  const titleOpacity = useTransform(progress, [0, 1], [0, 1]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 'env(safe-area-inset-top, 0px)',
        left: 0,
        right: 0,
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 110,
        pointerEvents: 'none',
        padding: '0 16px',
      }}
    >
      {/* Floating rounded capsule header card matching beUI Pro reference */}
      <motion.div
        ref={headerBgRef}
        style={{
          position: 'absolute',
          top: 0,
          left: sideMargin,
          right: sideMargin,
          bottom: 0,
          background: isLight ? 'rgba(255, 250, 245, 0.25)' : 'rgba(24, 20, 16, 0.20)',
          borderRadius: '24px',
          border: isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
          opacity: bgOpacity,
          pointerEvents: 'auto',
          zIndex: -1,
        }}
      />

      {/* Absolute Centered Section Title Layer (Centered against capsule bounds) */}
      <motion.div
        ref={titleRef}
        style={{
          position: 'absolute',
          left: sideMargin,
          right: sideMargin,
          top: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          padding: '0 52px',
          zIndex: 1,
          opacity: titleOpacity,
        }}
      >
        <span
          style={{
            fontSize: '17px',
            fontWeight: 800,
            color: 'var(--c-text-primary)',
            letterSpacing: '-0.02em',
            fontFamily: 'Manrope, sans-serif',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textAlign: 'center',
            maxWidth: '100%',
            pointerEvents: 'auto',
          }}
        >
          {title}
        </span>
      </motion.div>

      {/* Right Toolbar Actions Layer */}
      {toolbarActions && (
        <div
          style={{
            position: 'absolute',
            right: `calc(${sideMargin} + 12px)`,
            top: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            zIndex: 2,
            pointerEvents: 'auto',
          }}
        >
          {toolbarActions}
        </div>
      )}
    </div>
  );
}

export function SettingsScaffold({
  title,
  onBack,
  toolbarActions,
  children,
  hideBack,
  showLargeTitle = true,
}: SettingsScaffoldProps & { showLargeTitle?: boolean }) {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const headerBgRef = React.useRef<HTMLDivElement | null>(null);
  const titleRef = React.useRef<HTMLDivElement | null>(null);
  const largeTitleRef = React.useRef<HTMLHeadingElement | null>(null);

  const scrollYRaw = useMotionValue(0);
  const headerProgress = useTransform(scrollYRaw, [8, 48], [0, 1], { clamp: true });
  const largeTitleOpacity = useTransform(headerProgress, [0, 0.7], [1, 0]);
  const largeTitleY = useTransform(headerProgress, [0, 1], [0, -6]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    scrollYRaw.set(e.currentTarget.scrollTop);
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
        headerProgress={headerProgress}
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
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 58px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 96px)',
        }}
        className="no-scrollbar"
      >
        {/* Large scrolling title crossfades into floating header pill on scroll */}
        {showLargeTitle && (
          <motion.h2
            ref={largeTitleRef}
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: 'var(--c-text-primary)',
              letterSpacing: '-0.03em',
              fontFamily: 'Manrope, sans-serif',
              margin: '0 0 16px 4px',
              opacity: largeTitleOpacity,
              y: largeTitleY,
            }}
          >
            {title}
          </motion.h2>
        )}

        {/* Content Canvas */}
        <div style={{ width: '100%' }}>
          {children}
        </div>
      </div>
    </div>
  );
}


export interface SettingsContentContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function SettingsContentContainer({
  children,
  style,
  className = '',
  ...props
}: SettingsContentContainerProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--density-section-gap, 16px)',
        width: '100%',
        boxSizing: 'border-box',
        background: 'transparent',
        ...style,
      }}
      className={`studio-settings-content-container ${className}`}
      {...props}
    >
      {children}
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
