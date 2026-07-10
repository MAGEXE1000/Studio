import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MOTION_EASINGS } from '../navigation/AppAnimationSystem';
import { useScrollHide } from '@workspace/studio-core';

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
}

export function ScrollScaffold({
  bottomSpacing = true,
  children,
  style,
  className = '',
  ...props
}: ScrollScaffoldProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  useScrollHide(ref);

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
        willChange: 'transform',
        transform: 'translate3d(0, 0, 0)',
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
}

export function SettingsScaffold({
  title,
  onBack,
  toolbarActions,
  children,
}: SettingsScaffoldProps) {
  return (
    <div
      style={{
        animation: 'slide-forward var(--motion-duration-medium) var(--motion-ease-decelerate) both',
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
          background: 'transparent',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(128, 128, 128, 0.10)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--c-text-primary)',
            flexShrink: 0,
            transition: 'transform 130ms cubic-bezier(0.34, 1.15, 0.64, 1)',
          }}
          onPointerDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.91)';
          }}
          onPointerUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onPointerLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            arrow_back
          </span>
        </button>
        <span
          style={{
            fontSize: '22px',
            fontWeight: 800,
            color: 'var(--c-text-primary)',
            letterSpacing: '-0.03em',
            fontFamily: 'Manrope',
          }}
        >
          {title}
        </span>
        {toolbarActions && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {toolbarActions}
          </div>
        )}
      </div>
      <ScrollScaffold bottomSpacing={false} style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 24px)' }}>
        {children}
      </ScrollScaffold>
    </div>
  );
}

// ── 4. DialogScaffold ────────────────────────────────────────────────────────
// Center-centered modal on tablet, bottom-sheet on phone with max-height guard.
export interface DialogScaffoldProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function DialogScaffold({
  open,
  onClose,
  title,
  children,
  footer,
}: DialogScaffoldProps) {
  const { isLargeScreen } = useLayoutMetrics();

  return (
    <AnimatePresence>
      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: isLargeScreen ? 'center' : 'flex-end',
            justifyContent: 'center',
            padding: isLargeScreen ? '16px' : 0,
          }}
          className="studio-dialog-scaffold-root"
        >
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.70)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* Dialog Body */}
          <motion.div
            initial={isLargeScreen ? { scale: 0.95, opacity: 0 } : { y: '100%' }}
            animate={isLargeScreen ? { scale: 1, opacity: 1 } : { y: 0 }}
            exit={isLargeScreen ? { scale: 0.95, opacity: 0 } : { y: '100%' }}
            transition={MOTION_EASINGS.spring}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '480px',
              backgroundColor: 'var(--c-surface-highest)',
              borderRadius: isLargeScreen ? 'var(--radius-2xl)' : 'var(--radius-3xl) var(--radius-3xl) 0 0',
              border: `1px solid var(--c-border)`,
              boxShadow: 'var(--elevation-high)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: isLargeScreen
                ? 'min(640px, 85vh)'
                : 'calc(100vh - env(safe-area-inset-top, 0px) - 24px)',
              paddingBottom: isLargeScreen ? 0 : 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
              transition: 'background-color 200ms ease, border-color 200ms ease',
            }}
          >
            {/* Top Indicator handle for bottom sheet */}
            {!isLargeScreen && (
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--c-border)' }} />
              </div>
            )}

            {/* Header bar */}
            {title && (
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: `1px solid var(--c-border)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-headline)' }}>
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    color: 'var(--c-text-secondary)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    close
                  </span>
                </button>
              </div>
            )}

            {/* Content area */}
            <div
              style={{
                padding: '20px',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                flex: 1,
                fontSize: '13px',
                lineHeight: 1.5,
                color: 'var(--c-text-secondary)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {children}
            </div>

            {/* Optional Footer */}
            {footer && (
              <div
                style={{
                  padding: '12px 20px',
                  borderTop: `1px solid var(--c-border)`,
                  backgroundColor: 'var(--c-surface-lowest)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '8px',
                }}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── 5. HubScaffold ──────────────────────────────────────────────────────────
// Responsive Scaffold structure specifically optimized for main Studio Hub dashboard layouts.
export interface HubScaffoldProps {
  toolbar: React.ReactNode;
  bottomNavigation?: React.ReactNode;
  children: React.ReactNode;
}

export function HubScaffold({
  toolbar,
  bottomNavigation,
  children,
}: HubScaffoldProps) {
  const { isLargeScreen } = useLayoutMetrics();

  return (
    <ScreenScaffold safeAreaTop={false} safeAreaBottom={false}>
      {/* Fixed top toolbar */}
      <div style={{ flexShrink: 0, zIndex: 10 }}>
        {toolbar}
      </div>

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
      {bottomNavigation && (
        <div style={{ flexShrink: 0, zIndex: 10 }}>
          {bottomNavigation}
        </div>
      )}
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

export function SubAppScaffold({
  appKey,
  children,
  onReady,
}: SubAppScaffoldProps) {
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
