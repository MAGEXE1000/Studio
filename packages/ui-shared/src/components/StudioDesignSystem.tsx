import { useChordStore, ACCENT_COLORS, type AppKey } from '@workspace/studio-core';
import React, { lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedAppHeader } from './AppAnimationSystem';
import AppSpinner from './AppSpinner';

// ── Theme Hook ────────────────────────────────────────────────────────────
export function useStudioDesignSystem() {
  const settings = useChordStore(s => s.settings);
  const appKey = (settings.appMode ?? 'hub') as AppKey;
  const activeVis = settings.perApp?.[appKey] ?? {
    theme: settings.theme ?? 'dark',
    accentColor: settings.accentColor ?? 'blue',
    amoledMode: settings.amoledMode ?? false,
  };
  const accent = ACCENT_COLORS[activeVis.accentColor] ?? ACCENT_COLORS.blue;
  const isLight = settings.theme === 'light' || (settings.theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches);
  return { isLight, activeVis, accent };
}

// ── 1. Button ──────────────────────────────────────────────────────────────
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  children,
  style,
  className = '',
  disabled,
  ...props
}, ref) => {
  const { isLight, accent } = useStudioDesignSystem();

  const getColors = () => {
    if (variant === 'primary') {
      return {
        bg: isLight ? 'rgba(0, 0, 0, 0.9)' : accent.from,
        text: '#fff',
        border: 'transparent',
        hoverBg: isLight ? 'rgba(0,0,0,1)' : accent.to
      };
    }
    if (variant === 'danger') {
      return {
        bg: isLight ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.2)',
        text: isLight ? '#ef4444' : '#f87171',
        border: isLight ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.4)',
        hoverBg: isLight ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.3)'
      };
    }
    if (variant === 'ghost') {
      return {
        bg: 'transparent',
        text: 'var(--c-text-primary)',
        border: 'transparent',
        hoverBg: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
      };
    }
    return {
      bg: isLight ? 'rgba(0,0,0,0.03)' : 'var(--app-surface-high)',
      text: 'var(--c-text-primary)',
      border: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
      hoverBg: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.12)'
    };
  };

  const colors = getColors();
  const pad = size === 'sm' ? '6px 12px' : size === 'lg' ? '12px 24px' : '10px 18px';
  const fontSize = size === 'sm' ? '11px' : size === 'lg' ? '14px' : '12px';

  return (
    <motion.button
      ref={ref}
      whileTap={disabled || loading ? undefined : { scale: 0.96 }}
      style={{
        padding: pad,
        fontSize,
        fontFamily: 'Manrope, sans-serif',
        fontWeight: 700,
        borderRadius: '12px',
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1.5px solid ${colors.border}`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        outline: 'none',
        transition: 'background-color 200ms ease, border-color 200ms ease, color 200ms ease',
        ...style
      }}
      disabled={disabled || loading}
      className={`btn-smooth ${className}`}
      {...props}
    >
      {loading ? (
        <span className="material-symbols-outlined animate-spin" style={{ fontSize: '1.2em' }}>progress_activity</span>
      ) : icon ? (
        <span className="material-symbols-outlined" style={{ fontSize: '1.3em' }}>{icon}</span>
      ) : null}
      {children}
    </motion.button>
  );
});

Button.displayName = 'Button';

// ── 2. Card ────────────────────────────────────────────────────────────────
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  accentBorder?: boolean;
}

export function Card({
  interactive = false,
  accentBorder = false,
  children,
  style,
  className = '',
  ...props
}: CardProps) {
  const { isLight, accent } = useStudioDesignSystem();

  return (
    <div
      style={{
        borderRadius: '16px',
        padding: '16px',
        backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'var(--app-surface-mid)',
        border: accentBorder
          ? `1.5px solid ${accent.from}`
          : `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: isLight ? '0 4px 12px rgba(0,0,0,0.02)' : 'none',
        transition: 'transform 180ms ease, border-color 180ms ease, background-color 180ms ease',
        cursor: interactive ? 'pointer' : 'default',
        ...style
      }}
      className={`studio-card ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// ── 3. Surface ─────────────────────────────────────────────────────────────
export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  level?: 'low' | 'mid' | 'high';
}

export function Surface({
  glass = false,
  level = 'mid',
  children,
  style,
  className = '',
  ...props
}: SurfaceProps) {
  const { isLight, activeVis } = useStudioDesignSystem();

  const getBg = () => {
    if (glass) {
      return isLight
        ? 'rgba(255,255,255,0.72)'
        : activeVis.amoledMode
          ? 'rgba(0,0,0,0.85)'
          : 'rgba(26,26,30,0.72)';
    }
    const amoled = activeVis.amoledMode;
    if (level === 'low') {
      return amoled ? '#000000' : 'var(--app-bg)';
    }
    if (level === 'high') {
      return amoled ? 'rgba(20,20,20,1)' : 'var(--app-surface-high)';
    }
    return amoled ? 'rgba(10,10,10,1)' : 'var(--app-surface-mid)';
  };

  return (
    <div
      style={{
        backgroundColor: getBg(),
        border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
        backdropFilter: glass ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: glass ? 'blur(16px)' : 'none',
        color: 'var(--c-text-primary)',
        ...style
      }}
      className={`studio-surface ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// ── 4. Dialog ──────────────────────────────────────────────────────────────
export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
}: DialogProps) {
  const { isLight } = useStudioDesignSystem();

  return (
    <AnimatePresence>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
          />
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '480px',
              backgroundColor: isLight ? '#ffffff' : '#141416',
              borderRadius: '20px',
              border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
              boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '85vh'
            }}
          >
            {title && (
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, fontFamily: 'Manrope' }}>{title}</h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: 'var(--c-text-secondary)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
                </button>
              </div>
            )}
            
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1, fontSize: '13px', lineHeight: 1.5, color: 'var(--c-text-secondary)' }}>
              {children}
            </div>

            {footer && (
              <div style={{ padding: '12px 20px', borderTop: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`, backgroundColor: isLight ? '#fafafa' : '#0c0c0e', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── 5. Toolbar ─────────────────────────────────────────────────────────────
export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  actions?: React.ReactNode;
}

export function Toolbar({
  title,
  actions,
  children,
  style,
  className = '',
  ...props
}: ToolbarProps) {
  const { isLight } = useStudioDesignSystem();

  return (
    <div
      style={{
        height: '56px',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
        backgroundColor: 'transparent',
        flexShrink: 0,
        ...style
      }}
      className={`studio-toolbar ${className}`}
      {...props}
    >
      {title && (
        <span style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'Manrope', color: 'var(--c-text-primary)' }}>
          {title}
        </span>
      )}
      {children}
      {actions && <div style={{ display: 'flex', gap: '8px' }}>{actions}</div>}
    </div>
  );
}

// ── 6. Input ───────────────────────────────────────────────────────────────
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  desc?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  desc,
  error,
  style,
  className = '',
  ...props
}, ref) => {
  const { isLight } = useStudioDesignSystem();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
      {label && (
        <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--c-text-secondary)' }}>
          {label}
        </span>
      )}
      <input
        ref={ref}
        style={{
          padding: '10px 14px',
          borderRadius: '10px',
          fontSize: '13px',
          fontFamily: 'Inter, sans-serif',
          backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
          border: `1.5px solid ${error ? '#ef4444' : isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
          color: 'var(--c-text-primary)',
          outline: 'none',
          transition: 'border-color 180ms ease',
          ...style
        }}
        className={`studio-input ${className}`}
        {...props}
      />
      {desc && !error && (
        <span style={{ fontSize: '10px', color: 'var(--c-text-secondary)' }}>{desc}</span>
      )}
      {error && (
        <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 600 }}>{error}</span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// ── 7. Sheet ───────────────────────────────────────────────────────────────
export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Sheet({
  open,
  onClose,
  title,
  children
}: SheetProps) {
  const { isLight } = useStudioDesignSystem();

  return (
    <AnimatePresence>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)'
            }}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '480px',
              backgroundColor: isLight ? '#ffffff' : '#141416',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
              borderBottom: 'none',
              boxShadow: '0 -8px 32px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '85vh',
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)'
            }}
          >
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
              <div style={{ width: '40px', height: '4px', borderRadius: '2px', backgroundColor: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)' }} />
            </div>

            {title && (
              <div style={{ padding: '8px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, fontFamily: 'Manrope' }}>{title}</h3>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: 'var(--c-text-secondary)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
                </button>
              </div>
            )}

            <div style={{ padding: '0 20px 20px', overflowY: 'auto', flex: 1 }}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── 8. Header ──────────────────────────────────────────────────────────────
export interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
}

export function Header({
  title,
  subtitle,
  style,
  className = '',
  ...props
}: HeaderProps) {
  return (
    <div style={{ padding: '16px', flexShrink: 0, ...style }} className={className} {...props}>
      <AnimatedAppHeader title={title} subtitle={subtitle} />
    </div>
  );
}

// ── 9. Screen ──────────────────────────────────────────────────────────────
export interface ScreenProps extends React.HTMLAttributes<HTMLDivElement> {
  scrollable?: boolean;
}

export function Screen({
  scrollable = true,
  children,
  style,
  className = '',
  ...props
}: ScreenProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        overflow: scrollable ? 'auto' : 'hidden',
        position: 'relative',
        boxSizing: 'border-box',
        ...style
      }}
      className={`studio-screen ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// ── 10. Scaffold ───────────────────────────────────────────────────────────
export interface ScaffoldProps extends React.HTMLAttributes<HTMLDivElement> {
  toolbar?: React.ReactNode;
  bottomNavigation?: React.ReactNode;
  floatingButton?: React.ReactNode;
}

export function Scaffold({
  toolbar,
  bottomNavigation,
  floatingButton,
  children,
  style,
  className = '',
  ...props
}: ScaffoldProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        ...style
      }}
      className={`studio-scaffold ${className}`}
      {...props}
    >
      {toolbar}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {children}
      </div>
      {floatingButton && (
        <div style={{ position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom) + 80px)', right: '20px', zIndex: 40 }}>
          {floatingButton}
        </div>
      )}
      {bottomNavigation}
    </div>
  );
}

// ── 11. Bottom Navigation ──────────────────────────────────────────────────
export interface BottomNavigationProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export const BottomNavigation = React.forwardRef<HTMLElement, BottomNavigationProps>(({
  children,
  style,
  className = '',
  ...props
}, ref) => {
  const { isLight, activeVis } = useStudioDesignSystem();

  const amoledBg = isLight
    ? activeVis.amoledMode
      ? 'rgba(255, 255, 255, 0.92)'
      : 'rgba(255, 255, 255, 0.40)'
    : activeVis.amoledMode
      ? 'rgba(4,4,4,0.88)'
      : 'rgba(26,26,30,0.72)';

  return (
    <nav
      ref={ref}
      style={{
        position: 'fixed',
        bottom: 'var(--nav-safe-bottom)',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '88%',
        maxWidth: '360px',
        height: '56px',
        borderRadius: '2rem',
        border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.32)'}`,
        background: amoledBg,
        boxShadow: isLight
          ? '0 8px 32px rgba(0,0,0,0.08), 0 1.5px 0 rgba(255,255,255,0.70) inset'
          : '0 12px 48px rgba(0,0,0,0.50), 0 1.5px 0 rgba(255,255,255,0.08) inset',
        zIndex: 50,
        overflow: 'hidden',
        ...style
      }}
      className={`studio-bottom-nav ${className}`}
      {...props}
    >
      {children}
    </nav>
  );
});

BottomNavigation.displayName = 'BottomNavigation';

// ── 12. Floating Button ────────────────────────────────────────────────────
export interface FloatingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
}

export function FloatingButton({
  icon,
  style,
  className = '',
  ...props
}: FloatingButtonProps) {
  const { accent } = useStudioDesignSystem();

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      style={{
        width: '56px',
        height: '56px',
        borderRadius: '28px',
        backgroundColor: accent.from,
        color: '#ffffff',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        cursor: 'pointer',
        outline: 'none',
        ...style
      }}
      className={`studio-fab ${className}`}
      {...props}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 24 }}>{icon}</span>
    </motion.button>
  );
}

// ── 13. Progress ───────────────────────────────────────────────────────────
import StudioProgressBar from './StudioProgressBar';

export interface ProgressProps {
  value: number;
  accentFrom?: string;
  accentTo?: string;
  height?: number;
  style?: React.CSSProperties;
}

export function Progress(props: ProgressProps) {
  return <StudioProgressBar {...props} />;
}

// ── 14. Skeleton ───────────────────────────────────────────────────────────
export interface SkeletonProps {
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
  className?: string;
}

export function Skeleton({
  variant = 'rect',
  width = '100%',
  height = '16px',
  style,
  className = ''
}: SkeletonProps) {
  const { isLight } = useStudioDesignSystem();

  return (
    <div
      style={{
        width,
        height,
        borderRadius: variant === 'circle' ? '50%' : variant === 'text' ? '4px' : '10px',
        backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
      className={`studio-shimmer ${className}`}
    />
  );
}

// ── 15. Loading ────────────────────────────────────────────────────────────
export interface LoadingProps {
  statusText?: string;
  overlay?: boolean;
}

export function Loading({
  statusText = 'Loading...',
  overlay = false
}: LoadingProps) {
  const { isLight, accent } = useStudioDesignSystem();

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
      <AppSpinner size={32} color={accent.from} />
      {statusText && (
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--c-text-secondary)', fontFamily: 'Inter, sans-serif' }}>
          {statusText}
        </span>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(9,9,11,0.85)', zIndex: 1000 }}>
        {content}
      </div>
    );
  }

  return content;
}

// ── 16. Error ─────────────────────────────────────────────────────────────
export interface ErrorProps {
  message: string;
  onRetry?: () => void;
}

export function Error({
  message,
  onRetry
}: ErrorProps) {
  const { isLight } = useStudioDesignSystem();

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '16px',
        backgroundColor: isLight ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.1)',
        border: `1.5px solid ${isLight ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.2)'}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        textAlign: 'center'
      }}
      className="studio-error-card"
    >
      <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#ef4444' }}>error</span>
      <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: isLight ? '#b91c1c' : '#f87171', fontFamily: 'Inter, sans-serif' }}>
        {message}
      </p>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

// ── 17. Empty State ────────────────────────────────────────────────────────
export interface EmptyStateProps {
  message: string;
  icon?: string;
  description?: string;
}

export function EmptyState({
  message,
  icon = 'folder_open',
  description
}: EmptyStateProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', textAlign: 'center' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--c-text-secondary)', marginBottom: '8px', opacity: 0.5 }}>
        {icon}
      </span>
      <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 800, fontFamily: 'Manrope' }}>{message}</h3>
      {description && (
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--c-text-secondary)', fontFamily: 'Inter, sans-serif', maxWidth: '280px', lineHeight: 1.4 }}>
          {description}
        </p>
      )}
    </div>
  );
}
